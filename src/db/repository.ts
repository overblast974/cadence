import { addDays } from 'date-fns';
import { db, type CadenceDB } from './database';
import type { Category, Routine, Task, Weekday } from '../types';
import { buildTaskFromRoutine, missingInstances, plannedInstances, randomId } from '../lib/routineEngine';
import { fromDateKey, toDateKey } from '../lib/date';

// ---------------------------------------------------------------------------
// Tâches
// ---------------------------------------------------------------------------

export async function createTask(
  input: { title: string; date: string; time?: string; notes?: string; categoryId?: string },
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
    done: false,
    createdAt: now,
    updatedAt: now,
  };
  await database.tasks.add(task);
  return task;
}

export async function toggleTask(id: string, database: CadenceDB = db): Promise<void> {
  await database.transaction('rw', database.tasks, async () => {
    const task = await database.tasks.get(id);
    if (!task) return;
    const done = !task.done;
    await database.tasks.update(id, {
      done,
      completedAt: done ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
  });
}

export async function updateTask(
  id: string,
  changes: Partial<Pick<Task, 'title' | 'notes' | 'date' | 'time' | 'categoryId'>>,
  database: CadenceDB = db,
): Promise<void> {
  await database.tasks.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteTask(id: string, database: CadenceDB = db): Promise<void> {
  await database.tasks.delete(id);
}

export async function tasksForDate(date: string, database: CadenceDB = db): Promise<Task[]> {
  return database.tasks.where('date').equals(date).sortBy('time');
}

export async function tasksForRange(start: string, end: string, database: CadenceDB = db): Promise<Task[]> {
  return database.tasks.where('date').between(start, end, true, true).sortBy('date');
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
  version: 1;
  exportedAt: number;
  tasks: Task[];
  routines: Routine[];
  categories: Category[];
}

export async function exportBackup(database: CadenceDB = db): Promise<CadenceBackup> {
  const [tasks, routines, categories] = await Promise.all([
    database.tasks.toArray(),
    database.routines.toArray(),
    database.categories.toArray(),
  ]);
  return { version: 1, exportedAt: Date.now(), tasks, routines, categories };
}

export async function importBackup(backup: CadenceBackup, database: CadenceDB = db): Promise<void> {
  await database.transaction('rw', database.tasks, database.routines, database.categories, async () => {
    await Promise.all([database.tasks.clear(), database.routines.clear(), database.categories.clear()]);
    await Promise.all([
      database.tasks.bulkAdd(backup.tasks),
      database.routines.bulkAdd(backup.routines),
      database.categories.bulkAdd(backup.categories),
    ]);
  });
}
