import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';
import { db, seedDefaultCategories } from '../db/database';
import { ensureRoutineInstances } from '../db/repository';
import type { Category, Project, Routine, Task } from '../types';

/** Les sous-tâches ne sont pas affichées dans les listes du jour / de la semaine : elles vivent au sein de leur tâche parente. */
function withoutSubtasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.parentTaskId);
}

export function useTasksForDate(date: string): Task[] | undefined {
  return useLiveQuery(() => db.tasks.where('date').equals(date).sortBy('time').then(withoutSubtasks), [date]);
}

export function useTasksForRange(start: string, end: string): Task[] | undefined {
  return useLiveQuery(
    () => db.tasks.where('date').between(start, end, true, true).sortBy('date').then(withoutSubtasks),
    [start, end],
  );
}

export function useSubtasks(parentId: string | undefined): Task[] | undefined {
  return useLiveQuery(
    () => (parentId ? db.tasks.where('parentTaskId').equals(parentId).sortBy('createdAt') : Promise.resolve<Task[]>([])),
    [parentId],
  );
}

export function useProjects(): Project[] | undefined {
  return useLiveQuery(
    () => db.projects.toArray().then((ps) => [...ps].sort((a, b) => b.createdAt - a.createdAt)),
    [],
  );
}

export function useTasksForProject(projectId: string | undefined): Task[] | undefined {
  return useLiveQuery(
    () =>
      projectId
        ? db.tasks
            .where('projectId')
            .equals(projectId)
            .toArray()
            .then((tasks) =>
              withoutSubtasks(tasks).sort((a, b) => (a.date === b.date ? (a.time ?? '').localeCompare(b.time ?? '') : a.date.localeCompare(b.date))),
            )
        : Promise.resolve<Task[]>([]),
    [projectId],
  );
}

export function useRoutines(): Routine[] | undefined {
  return useLiveQuery(
    () => db.routines.toArray().then((rs) => [...rs].sort((a, b) => a.createdAt - b.createdAt)),
    [],
  );
}

export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => db.categories.toArray(), []);
}

/**
 * Initialise la base au premier montage : insère les catégories par défaut puis
 * matérialise les occurrences de routines à venir. À relancer silencieusement
 * à chaque démarrage (idempotent).
 */
export function useBootstrapDatabase(): void {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      try {
        await seedDefaultCategories();
        await ensureRoutineInstances();
      } catch (error) {
        console.error('Échec de l’initialisation de la base locale', error);
      }
    })();
  }, []);
}
