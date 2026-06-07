import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { CadenceDB, seedDefaultCategories, resetSeedFlagForTests } from '../database';
import {
  createCategory,
  createRoutine,
  createTask,
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

describe('export / import (sauvegarde locale)', () => {
  it('exporte puis réimporte fidèlement les données', async () => {
    await seedDefaultCategories(db);
    await createTask({ title: 'Tâche A', date: '2024-06-03' }, db);
    await createRoutine({ title: 'Routine A', daysOfWeek: [2] }, db);

    const backup = await exportBackup(db);
    expect(backup.version).toBe(1);
    expect(backup.tasks).toHaveLength(1);
    expect(backup.routines).toHaveLength(1);
    expect(backup.categories).toHaveLength(4);

    // On vide la base puis on restaure : tout doit revenir à l'identique.
    await db.tasks.clear();
    await db.routines.clear();
    await db.categories.clear();

    await importBackup(backup, db);

    expect(await db.tasks.count()).toBe(1);
    expect(await db.routines.count()).toBe(1);
    expect(await db.categories.count()).toBe(4);
    const restoredTask = (await db.tasks.toArray())[0];
    expect(restoredTask.title).toBe('Tâche A');
  });
});
