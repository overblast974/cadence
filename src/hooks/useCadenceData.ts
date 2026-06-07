import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';
import { db, seedDefaultCategories } from '../db/database';
import { ensureRoutineInstances } from '../db/repository';
import type { Category, Routine, Task } from '../types';

export function useTasksForDate(date: string): Task[] | undefined {
  return useLiveQuery(() => db.tasks.where('date').equals(date).sortBy('time'), [date]);
}

export function useTasksForRange(start: string, end: string): Task[] | undefined {
  return useLiveQuery(
    () => db.tasks.where('date').between(start, end, true, true).sortBy('date'),
    [start, end],
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
      await seedDefaultCategories();
      await ensureRoutineInstances();
    })();
  }, []);
}
