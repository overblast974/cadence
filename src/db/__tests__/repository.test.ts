import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { CadenceDB, seedDefaultCategories, resetSeedFlagForTests } from '../database';
import {
  createCategory,
  createProject,
  createRoutine,
  createSubtask,
  createTask,
  deleteProject,
  deleteRoutine,
  deleteTask,
  ensureRoutineInstances,
  exportBackup,
  importBackup,
  tasksForDate,
  tasksForRange,
  toggleTask,
  updateRoutine,
  updateTask,
  type CadenceBackup,
} from '../repository';
import { fromDateKey, isoWeekday, toDateKey } from '../../lib/date';

let db: CadenceDB;

beforeEach(async () => {
  resetSeedFlagForTests();
  db = new CadenceDB(`cadence-test-${Math.random().toString(36).slice(2)}`);
  await db.open();
});

afterEach(async () => {
  db.close();
  await db.delete();
});

describe('seedDefaultCategories', () => {
  it('insère les catégories par défaut une seule fois', async () => {
    await seedDefaultCategories(db);
    await seedDefaultCategories(db);
    const categories = await db.categories.toArray();
    expect(categories).toHaveLength(4);
  });

  it('ne réinsère rien si des catégories existent déjà', async () => {
    await createCategory({ name: 'Perso', color: 'violet', icon: 'Sparkles' }, db);
    resetSeedFlagForTests();
    await seedDefaultCategories(db);
    const categories = await db.categories.toArray();
    expect(categories).toHaveLength(1);
  });
});

describe('tasks CRUD', () => {
  it('crée puis retrouve une tâche par date', async () => {
    await createTask({ title: 'Faire les courses', date: '2024-06-03', time: '18:00' }, db);
    const tasks = await tasksForDate('2024-06-03', db);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ title: 'Faire les courses', date: '2024-06-03', done: false });
  });

  it('retrouve les tâches sur une plage de dates triées par date', async () => {
    await createTask({ title: 'A', date: '2024-06-05' }, db);
    await createTask({ title: 'B', date: '2024-06-03' }, db);
    await createTask({ title: 'C', date: '2024-06-04' }, db);

    const tasks = await tasksForRange('2024-06-03', '2024-06-05', db);
    expect(tasks.map((t) => t.title)).toEqual(['B', 'C', 'A']);
  });

  it('bascule l’état "fait" et horodate la complétion', async () => {
    const task = await createTask({ title: 'Lire', date: '2024-06-03' }, db);
    expect(task.done).toBe(false);

    await toggleTask(task.id, db);
    let updated = await db.tasks.get(task.id);
    expect(updated?.done).toBe(true);
    expect(updated?.completedAt).toBeTypeOf('number');

    await toggleTask(task.id, db);
    updated = await db.tasks.get(task.id);
    expect(updated?.done).toBe(false);
    expect(updated?.completedAt).toBeUndefined();
  });

  it('met à jour les champs demandés et touche updatedAt', async () => {
    const task = await createTask({ title: 'Lire', date: '2024-06-03' }, db);
    await updateTask(task.id, { title: 'Lire 30 minutes', time: '20:00' }, db);
    const updated = await db.tasks.get(task.id);
    expect(updated?.title).toBe('Lire 30 minutes');
    expect(updated?.time).toBe('20:00');
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(task.updatedAt);
  });

  it('supprime une tâche', async () => {
    const task = await createTask({ title: 'À supprimer', date: '2024-06-03' }, db);
    await deleteTask(task.id, db);
    expect(await db.tasks.get(task.id)).toBeUndefined();
  });
});

describe('ensureRoutineInstances', () => {
  it('matérialise une tâche pour chaque occurrence prévue dans la fenêtre de génération', async () => {
    // référence : jeudi 2024-06-06 → routine programmée lundi + jeudi
    const reference = new Date(2024, 5, 6);
    await createRoutine({ title: 'Sport', daysOfWeek: [1, 4] }, db);

    const created = await ensureRoutineInstances(reference, db);
    expect(created).toBeGreaterThan(0);

    const tasks = await db.tasks.toArray();
    expect(tasks.every((t) => t.routineId)).toBe(true);
    expect(tasks.every((t) => t.title === 'Sport')).toBe(true);
    expect(tasks.every((t) => [1, 4].includes(isoWeekday(fromDateKey(t.date))))).toBe(true);
  });

  it('est idempotent : ne crée pas de doublons en cas de relance', async () => {
    const reference = new Date(2024, 5, 6);
    await createRoutine({ title: 'Sport', daysOfWeek: [1, 4] }, db);

    const firstRun = await ensureRoutineInstances(reference, db);
    const secondRun = await ensureRoutineInstances(reference, db);

    expect(firstRun).toBeGreaterThan(0);
    expect(secondRun).toBe(0);
  });

  it('ne génère rien pour une routine désactivée', async () => {
    const reference = new Date(2024, 5, 6);
    const routine = await createRoutine({ title: 'Sport', daysOfWeek: [1, 4] }, db);
    await updateRoutine(routine.id, { active: false }, db);

    const created = await ensureRoutineInstances(reference, db);
    expect(created).toBe(0);
    expect(await db.tasks.count()).toBe(0);
  });
});

describe('deleteRoutine', () => {
  it('supprime la routine et ses occurrences futures non terminées, mais conserve l’historique', async () => {
    const reference = new Date(2024, 5, 6); // jeudi
    const routine = await createRoutine({ title: 'Sport', daysOfWeek: [1, 4] }, db);
    await ensureRoutineInstances(reference, db);

    // On marque comme faite une tâche passée pour simuler de l'historique.
    const allTasks = await db.tasks.where('routineId').equals(routine.id).toArray();
    const past = allTasks.find((t) => t.date < toDateKey(reference));
    const future = allTasks.find((t) => t.date >= toDateKey(reference) && !t.done);
    expect(past).toBeDefined();
    expect(future).toBeDefined();
    if (past) await toggleTask(past.id, db);

    await deleteRoutine(routine.id, reference, db);

    expect(await db.routines.get(routine.id)).toBeUndefined();
    if (past) expect(await db.tasks.get(past.id)).toBeDefined(); // historique conservé
    if (future) expect(await db.tasks.get(future.id)).toBeUndefined(); // futur supprimé
  });
});

describe('sous-tâches', () => {
  it('crée une sous-tâche héritant de la date et de la catégorie de sa tâche parente', async () => {
    const parent = await createTask({ title: 'Organiser la fête', date: '2024-06-03', categoryId: 'cat-perso' }, db);
    const subtask = await createSubtask(parent.id, { title: 'Acheter le gâteau' }, db);
    expect(subtask.parentTaskId).toBe(parent.id);
    expect(subtask.date).toBe(parent.date);
    expect(subtask.categoryId).toBe(parent.categoryId);
  });

  it('valide automatiquement la tâche parente une fois toutes les sous-tâches terminées', async () => {
    const parent = await createTask({ title: 'Organiser la fête', date: '2024-06-03' }, db);
    const sub1 = await createSubtask(parent.id, { title: 'Acheter le gâteau' }, db);
    const sub2 = await createSubtask(parent.id, { title: 'Envoyer les invitations' }, db);

    await toggleTask(sub1.id, db);
    expect((await db.tasks.get(parent.id))?.done).toBe(false);

    await toggleTask(sub2.id, db);
    expect((await db.tasks.get(parent.id))?.done).toBe(true);

    // Décocher une sous-tâche rouvre la tâche parente.
    await toggleTask(sub1.id, db);
    expect((await db.tasks.get(parent.id))?.done).toBe(false);
  });

  it('cocher/décocher une tâche parente répercute l’état sur toutes ses sous-tâches', async () => {
    const parent = await createTask({ title: 'Organiser la fête', date: '2024-06-03' }, db);
    const sub1 = await createSubtask(parent.id, { title: 'Acheter le gâteau' }, db);
    const sub2 = await createSubtask(parent.id, { title: 'Envoyer les invitations' }, db);

    await toggleTask(parent.id, db);
    expect((await db.tasks.get(sub1.id))?.done).toBe(true);
    expect((await db.tasks.get(sub2.id))?.done).toBe(true);
  });

  it('rouvre une tâche parente déjà validée quand on lui ajoute une nouvelle sous-tâche', async () => {
    const parent = await createTask({ title: 'Organiser la fête', date: '2024-06-03' }, db);
    await toggleTask(parent.id, db);
    expect((await db.tasks.get(parent.id))?.done).toBe(true);

    await createSubtask(parent.id, { title: 'Acheter le gâteau' }, db);
    expect((await db.tasks.get(parent.id))?.done).toBe(false);
  });

  it('supprime les sous-tâches avec leur tâche parente', async () => {
    const parent = await createTask({ title: 'Organiser la fête', date: '2024-06-03' }, db);
    const subtask = await createSubtask(parent.id, { title: 'Acheter le gâteau' }, db);
    await deleteTask(parent.id, db);
    expect(await db.tasks.get(subtask.id)).toBeUndefined();
  });
});

describe('projets', () => {
  it('valide automatiquement le projet une fois toutes ses tâches terminées', async () => {
    const project = await createProject({ title: 'Déménagement' }, db);
    const taskA = await createTask({ title: 'Trouver des cartons', date: '2024-06-03', projectId: project.id }, db);
    const taskB = await createTask({ title: 'Réserver le camion', date: '2024-06-05', projectId: project.id }, db);

    await toggleTask(taskA.id, db);
    expect((await db.projects.get(project.id))?.completedAt).toBeUndefined();

    await toggleTask(taskB.id, db);
    expect((await db.projects.get(project.id))?.completedAt).toBeDefined();

    // Rouvrir une tâche rouvre le projet.
    await toggleTask(taskA.id, db);
    expect((await db.projects.get(project.id))?.completedAt).toBeUndefined();
  });

  it('délie les tâches plutôt que de les supprimer quand on supprime le projet', async () => {
    const project = await createProject({ title: 'Déménagement' }, db);
    const task = await createTask({ title: 'Trouver des cartons', date: '2024-06-03', projectId: project.id }, db);

    await deleteProject(project.id, db);

    expect(await db.projects.get(project.id)).toBeUndefined();
    expect((await db.tasks.get(task.id))?.projectId).toBeUndefined();
  });

  it('synchronise l’état du projet quand une tâche change de projet', async () => {
    const projectA = await createProject({ title: 'Projet A' }, db);
    const projectB = await createProject({ title: 'Projet B' }, db);
    const task = await createTask({ title: 'Tâche unique', date: '2024-06-03', projectId: projectA.id }, db);
    await toggleTask(task.id, db);
    expect((await db.projects.get(projectA.id))?.completedAt).toBeDefined();

    await updateTask(task.id, { projectId: projectB.id }, db);
    expect((await db.projects.get(projectA.id))?.completedAt).toBeUndefined();
    expect((await db.projects.get(projectB.id))?.completedAt).toBeDefined();
  });
});

describe('export / import (sauvegarde locale)', () => {
  it('exporte puis réimporte fidèlement les données', async () => {
    await seedDefaultCategories(db);
    await createTask({ title: 'Tâche A', date: '2024-06-03' }, db);
    await createRoutine({ title: 'Routine A', daysOfWeek: [2] }, db);

    await createProject({ title: 'Projet A' }, db);

    const backup = await exportBackup(db);
    expect(backup.version).toBe(2);
    expect(backup.tasks).toHaveLength(1);
    expect(backup.routines).toHaveLength(1);
    expect(backup.categories).toHaveLength(4);
    expect(backup.projects).toHaveLength(1);

    // On vide la base puis on restaure : tout doit revenir à l'identique.
    await db.tasks.clear();
    await db.routines.clear();
    await db.categories.clear();
    await db.projects.clear();

    await importBackup(backup, db);

    expect(await db.tasks.count()).toBe(1);
    expect(await db.routines.count()).toBe(1);
    expect(await db.categories.count()).toBe(4);
    expect(await db.projects.count()).toBe(1);
    const restoredTask = (await db.tasks.toArray())[0];
    expect(restoredTask.title).toBe('Tâche A');
  });

  it('réimporte une sauvegarde au format v1 (sans projets)', async () => {
    await seedDefaultCategories(db);
    await createTask({ title: 'Tâche B', date: '2024-06-04' }, db);

    const legacyBackup: CadenceBackup = {
      version: 1,
      exportedAt: Date.now(),
      tasks: await db.tasks.toArray(),
      routines: [],
      categories: await db.categories.toArray(),
    };

    await db.tasks.clear();
    await db.categories.clear();

    await importBackup(legacyBackup, db);

    expect(await db.tasks.count()).toBe(1);
    expect(await db.projects.count()).toBe(0);
  });
});
