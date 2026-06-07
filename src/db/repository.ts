import { addDays } from 'date-fns';
import { db, type CadenceDB } from './database';
import type { Category, Project, Routine, Task, Weekday } from '../types';
import { buildTaskFromRoutine, missingInstances, plannedInstances, randomId } from '../lib/routineEngine';
import { fromDateKey, toDateKey } from '../lib/date';

// ---------------------------------------------------------------------------
// Tâches
// ---------------------------------------------------------------------------

export async function createTask(
  input: { title: string; date: string; time?: string; notes?: string; categoryId?: string; projectId?: string },
  database: CadenceDB = db,
): Promise<Task> {
  const now = Date.now();
  const task: Task = {
    id: randomId(),
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    date: input.date,
    time: input.time || undefined,
    categoryId: input.categoryId,
    projectId: input.projectId,
    done: false,
    createdAt: now,
    updatedAt: now,
  };
  await database.tasks.add(task);
  return task;
}

export async function toggleTask(id: string, database: CadenceDB = db): Promise<void> {
  await database.transaction('rw', database.tasks, database.projects, async () => {
    const task = await database.tasks.get(id);
    if (!task) return;
    const done = !task.done;
    const now = Date.now();
    await database.tasks.update(id, { done, completedAt: done ? now : undefined, updatedAt: now });

    // Cocher/décocher une tâche qui a des sous-tâches répercute l'état sur toutes ses sous-tâches.
    const children = await database.tasks.where('parentTaskId').equals(id).toArray();
    await Promise.all(
      children
        .filter((child) => child.done !== done)
        .map((child) => database.tasks.update(child.id, { done, completedAt: done ? now : undefined, updatedAt: now })),
    );

    if (task.parentTaskId) await syncParentCompletion(task.parentTaskId, now, database);
    if (task.projectId) await syncProjectCompletion(task.projectId, now, database);
  });
}

export async function updateTask(
  id: string,
  changes: Partial<Pick<Task, 'title' | 'notes' | 'date' | 'time' | 'categoryId' | 'projectId'>>,
  database: CadenceDB = db,
): Promise<void> {
  await database.transaction('rw', database.tasks, database.projects, async () => {
    const task = await database.tasks.get(id);
    if (!task) return;
    const now = Date.now();
    await database.tasks.update(id, { ...changes, updatedAt: now });
    if ('projectId' in changes) {
      if (task.projectId && task.projectId !== changes.projectId) await syncProjectCompletion(task.projectId, now, database);
      if (changes.projectId) await syncProjectCompletion(changes.projectId, now, database);
    }
  });
}

export async function deleteTask(id: string, database: CadenceDB = db): Promise<void> {
  await database.transaction('rw', database.tasks, database.projects, async () => {
    const task = await database.tasks.get(id);
    if (!task) return;
    const now = Date.now();
    const children = await database.tasks.where('parentTaskId').equals(id).toArray();
    await database.tasks.bulkDelete([id, ...children.map((c) => c.id)]);
    if (task.parentTaskId) await syncParentCompletion(task.parentTaskId, now, database);
    if (task.projectId) await syncProjectCompletion(task.projectId, now, database);
  });
}

export async function tasksForDate(date: string, database: CadenceDB = db): Promise<Task[]> {
  return database.tasks.where('date').equals(date).sortBy('time');
}

export async function tasksForRange(start: string, end: string, database: CadenceDB = db): Promise<Task[]> {
  return database.tasks.where('date').between(start, end, true, true).sortBy('date');
}

// ---------------------------------------------------------------------------
// Sous-tâches
// ---------------------------------------------------------------------------

/**
 * Crée une sous-tâche au sein d'une tâche existante. Elle hérite de la date et
 * de la catégorie de sa tâche parente (les sous-tâches ne sont pas plani-
 * fiables indépendamment : elles forment une simple checklist).
 */
export async function createSubtask(parentId: string, input: { title: string }, database: CadenceDB = db): Promise<Task> {
  return database.transaction('rw', database.tasks, database.projects, async () => {
    const parent = await database.tasks.get(parentId);
    if (!parent) throw new Error('Tâche parente introuvable');
    const now = Date.now();
    const subtask: Task = {
      id: randomId(),
      title: input.title.trim(),
      date: parent.date,
      categoryId: parent.categoryId,
      parentTaskId: parentId,
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    await database.tasks.add(subtask);
    // Ajouter une sous-tâche non terminée rouvre une tâche parente déjà validée.
    if (parent.done) {
      await database.tasks.update(parentId, { done: false, completedAt: undefined, updatedAt: now });
      if (parent.projectId) await syncProjectCompletion(parent.projectId, now, database);
    }
    return subtask;
  });
}

export async function subtasksForParent(parentId: string, database: CadenceDB = db): Promise<Task[]> {
  return database.tasks.where('parentTaskId').equals(parentId).sortBy('createdAt');
}

/** Recalcule l'état (fait/à faire) d'une tâche parente d'après ses sous-tâches. */
async function syncParentCompletion(parentId: string, now: number, database: CadenceDB): Promise<void> {
  const [parent, children] = await Promise.all([
    database.tasks.get(parentId),
    database.tasks.where('parentTaskId').equals(parentId).toArray(),
  ]);
  if (!parent || children.length === 0) return;
  const allDone = children.every((c) => c.done);
  if (allDone === parent.done) return;
  await database.tasks.update(parentId, { done: allDone, completedAt: allDone ? now : undefined, updatedAt: now });
  if (parent.projectId) await syncProjectCompletion(parent.projectId, now, database);
}

// ---------------------------------------------------------------------------
// Projets
// ---------------------------------------------------------------------------

export async function createProject(
  input: { title: string; notes?: string; categoryId?: string },
  database: CadenceDB = db,
): Promise<Project> {
  const now = Date.now();
  const project: Project = {
    id: randomId(),
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    categoryId: input.categoryId,
    createdAt: now,
    updatedAt: now,
  };
  await database.projects.add(project);
  return project;
}

export async function updateProject(
  id: string,
  changes: Partial<Pick<Project, 'title' | 'notes' | 'categoryId'>>,
  database: CadenceDB = db,
): Promise<void> {
  await database.projects.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteProject(id: string, database: CadenceDB = db): Promise<void> {
  await database.transaction('rw', database.projects, database.tasks, async () => {
    const linked = await database.tasks.where('projectId').equals(id).toArray();
    const now = Date.now();
    await Promise.all(linked.map((t) => database.tasks.update(t.id, { projectId: undefined, updatedAt: now })));
    await database.projects.delete(id);
  });
}

export async function tasksForProject(projectId: string, database: CadenceDB = db): Promise<Task[]> {
  const tasks = await database.tasks.where('projectId').equals(projectId).toArray();
  return tasks.filter((t) => !t.parentTaskId).sort((a, b) => (a.date === b.date ? (a.time ?? '').localeCompare(b.time ?? '') : a.date.localeCompare(b.date)));
}

/** Recalcule l'état (terminé/non terminé) d'un projet d'après ses tâches liées. */
async function syncProjectCompletion(projectId: string, now: number, database: CadenceDB): Promise<void> {
  const [project, tasks] = await Promise.all([
    database.projects.get(projectId),
    database.tasks.where('projectId').equals(projectId).filter((t) => !t.parentTaskId).toArray(),
  ]);
  if (!project) return;
  // Un projet sans tâche n'est jamais "terminé" : on évite ainsi de marquer
  // comme accompli un projet vide (création) ou vidé de toutes ses tâches.
  const allDone = tasks.length > 0 && tasks.every((t) => t.done);
  const wasComplete = project.completedAt !== undefined;
  if (allDone === wasComplete) return;
  await database.projects.update(projectId, { completedAt: allDone ? now : undefined, updatedAt: now });
}

// ---------------------------------------------------------------------------
// Routines
// ---------------------------------------------------------------------------

export async function createRoutine(
  input: { title: string; daysOfWeek: Weekday[]; time?: string; notes?: string; categoryId?: string },
  database: CadenceDB = db,
): Promise<Routine> {
  const now = Date.now();
  const routine: Routine = {
    id: randomId(),
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    time: input.time || undefined,
    daysOfWeek: [...input.daysOfWeek].sort(),
    categoryId: input.categoryId,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  await database.routines.add(routine);
  return routine;
}

export async function updateRoutine(
  id: string,
  changes: Partial<Pick<Routine, 'title' | 'notes' | 'daysOfWeek' | 'time' | 'categoryId' | 'active'>>,
  database: CadenceDB = db,
): Promise<void> {
  await database.routines.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteRoutine(id: string, reference: Date = new Date(), database: CadenceDB = db): Promise<void> {
  await database.transaction('rw', database.routines, database.tasks, async () => {
    await database.routines.delete(id);
    // On retire les occurrences futures non terminées générées par cette routine,
    // mais on conserve l'historique (tâches passées / déjà validées).
    const referenceKey = toDateKey(reference);
    const futureUnfinished = await database.tasks
      .where('routineId')
      .equals(id)
      .filter((t) => t.date >= referenceKey && !t.done)
      .toArray();
    await database.tasks.bulkDelete(futureUnfinished.map((t) => t.id));
  });
}

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

export async function createCategory(
  input: { name: string; color: string; icon: string },
  database: CadenceDB = db,
): Promise<Category> {
  const category: Category = {
    id: randomId(),
    name: input.name.trim(),
    color: input.color,
    icon: input.icon,
    createdAt: Date.now(),
  };
  await database.categories.add(category);
  return category;
}

// ---------------------------------------------------------------------------
// Génération des occurrences de routines (matérialisation des tâches)
// ---------------------------------------------------------------------------

const GENERATION_WINDOW_PAST_DAYS = 7;
const GENERATION_WINDOW_FUTURE_DAYS = 35;

/**
 * S'assure que toutes les routines actives ont bien une tâche matérialisée
 * pour chaque occurrence prévue dans la fenêtre [aujourd'hui-7j, aujourd'hui+35j].
 * Idempotent : peut être appelée à chaque démarrage sans créer de doublons.
 */
export async function ensureRoutineInstances(reference: Date = new Date(), database: CadenceDB = db): Promise<number> {
  const start = addDays(reference, -GENERATION_WINDOW_PAST_DAYS);
  const end = addDays(reference, GENERATION_WINDOW_FUTURE_DAYS);
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);

  const [allRoutines, existing] = await Promise.all([
    database.routines.toArray(),
    database.tasks.where('date').between(startKey, endKey, true, true).toArray(),
  ]);
  const routines = allRoutines.filter((r) => r.active);

  const planned = plannedInstances(routines, fromDateKey(startKey), fromDateKey(endKey));
  const missing = missingInstances(planned, existing);
  if (missing.length === 0) return 0;

  const routineById = new Map(routines.map((r) => [r.id, r]));
  const newTasks = missing
    .map(({ routineId, date }) => {
      const routine = routineById.get(routineId);
      return routine ? buildTaskFromRoutine(routine, date) : undefined;
    })
    .filter((t): t is Task => Boolean(t));

  await database.tasks.bulkAdd(newTasks);
  return newTasks.length;
}

// ---------------------------------------------------------------------------
// Export / Import (sauvegarde locale en JSON)
// ---------------------------------------------------------------------------

export interface CadenceBackup {
  version: 1 | 2;
  exportedAt: number;
  tasks: Task[];
  routines: Routine[];
  categories: Category[];
  projects?: Project[];
}

export async function exportBackup(database: CadenceDB = db): Promise<CadenceBackup> {
  const [tasks, routines, categories, projects] = await Promise.all([
    database.tasks.toArray(),
    database.routines.toArray(),
    database.categories.toArray(),
    database.projects.toArray(),
  ]);
  return { version: 2, exportedAt: Date.now(), tasks, routines, categories, projects };
}

export async function importBackup(backup: CadenceBackup, database: CadenceDB = db): Promise<void> {
  await database.transaction('rw', database.tasks, database.routines, database.categories, database.projects, async () => {
    await Promise.all([database.tasks.clear(), database.routines.clear(), database.categories.clear(), database.projects.clear()]);
    await Promise.all([
      database.tasks.bulkAdd(backup.tasks),
      database.routines.bulkAdd(backup.routines),
      database.categories.bulkAdd(backup.categories),
      database.projects.bulkAdd(backup.projects ?? []),
    ]);
  });
}
