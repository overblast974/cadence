import { addDays, format } from 'date-fns';
import type { Task } from '../types';

export interface DaySummary {
  date: string;
  total: number;
  done: number;
}

/** Regroupe une liste de tâches par jour et calcule le total / terminé pour chacun. */
export function summarizeByDay(tasks: Task[], dateKeys: string[]): DaySummary[] {
  const map = new Map<string, DaySummary>();
  for (const key of dateKeys) map.set(key, { date: key, total: 0, done: 0 });
  for (const task of tasks) {
    const entry = map.get(task.date);
    if (!entry) continue;
    entry.total += 1;
    if (task.done) entry.done += 1;
  }
  return dateKeys.map((key) => map.get(key)!);
}

/** Une journée est "complète" si elle contient au moins une tâche et que toutes sont validées. */
export function isDayComplete(day: DaySummary): boolean {
  return day.total > 0 && day.done === day.total;
}

/**
 * Calcule la série de jours consécutifs (en remontant depuis le dernier jour
 * de la liste, généralement aujourd'hui) où la journée est "complète".
 * Un jour sans aucune tâche prévue n'interrompt pas la série (rien à faire ≠ échec).
 */
export function currentStreak(days: DaySummary[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    if (day.total === 0) continue;
    if (isDayComplete(day)) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

/** Taux de complétion global sur l'ensemble des jours fournis (0..1). */
export function overallCompletionRate(days: DaySummary[]): number {
  const totals = days.reduce(
    (acc, d) => ({ total: acc.total + d.total, done: acc.done + d.done }),
    { total: 0, done: 0 },
  );
  if (totals.total === 0) return 0;
  return totals.done / totals.total;
}

/** Génère les `count` clés de date se terminant à `end` (incluse), en ordre chronologique. */
export function trailingDateKeys(end: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) => format(addDays(end, i - (count - 1)), 'yyyy-MM-dd'));
}

/** Intensité 0..3 utilisée pour colorer une cellule de heatmap. */
export function intensityLevel(day: DaySummary): 0 | 1 | 2 | 3 {
  if (day.total === 0) return 0;
  const ratio = day.done / day.total;
  if (ratio === 0) return 0;
  if (ratio < 0.5) return 1;
  if (ratio < 1) return 2;
  return 3;
}
