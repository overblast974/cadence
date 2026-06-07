import { addDays, format } from 'date-fns';
import type { Routine, Task } from '../types';
import { isoWeekday } from './date';

export interface PlannedInstance {
  routineId: string;
  date: string;
}

/**
 * Calcule, pour une routine active et une plage de dates [start, end] (inclusive),
 * la liste des dates où elle doit produire une tâche.
 *
 * Fonction pure : aucune dépendance à la base, donc facilement testable et
 * réutilisable aussi bien côté génération que côté prévisualisation dans l'UI.
 */
export function plannedDatesForRoutine(routine: Routine, start: Date, end: Date): string[] {
  if (!routine.active || routine.daysOfWeek.length === 0) return [];

  const dates: string[] = [];
  const days = new Set(routine.daysOfWeek);
  let cursor = start;
  // Garde-fou : on ne génère jamais plus de 370 itérations (un peu plus d'un an).
  for (let i = 0; i < 370 && cursor <= end; i += 1) {
    if (days.has(isoWeekday(cursor))) {
      dates.push(format(cursor, 'yyyy-MM-dd'));
    }
    cursor = addDays(cursor, 1);
  }
  return dates;
}

/**
 * Calcule l'ensemble des occurrences (routine x date) attendues sur la plage donnée,
 * pour toutes les routines actives fournies.
 */
export function plannedInstances(routines: Routine[], start: Date, end: Date): PlannedInstance[] {
  const out: PlannedInstance[] = [];
  for (const routine of routines) {
    for (const date of plannedDatesForRoutine(routine, start, end)) {
      out.push({ routineId: routine.id, date });
    }
  }
  return out;
}

/**
 * Détermine quelles occurrences doivent être créées : celles présentes dans
 * `planned` mais absentes de `existing` (déjà en base).
 */
export function missingInstances(planned: PlannedInstance[], existing: Task[]): PlannedInstance[] {
  const existingKeys = new Set(existing.filter((t) => t.routineId).map((t) => `${t.routineId}__${t.date}`));
  return planned.filter((p) => !existingKeys.has(`${p.routineId}__${p.date}`));
}

/** Construit l'objet Task prêt à être inséré pour une occurrence de routine donnée. */
export function buildTaskFromRoutine(routine: Routine, date: string, idFactory: () => string = randomId): Task {
  const now = Date.now();
  return {
    id: idFactory(),
    title: routine.title,
    notes: routine.notes,
    date,
    time: routine.time,
    done: false,
    categoryId: routine.categoryId,
    routineId: routine.id,
    createdAt: now,
    updatedAt: now,
  };
}

export function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}
