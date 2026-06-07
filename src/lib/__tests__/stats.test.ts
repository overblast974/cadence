import { describe, expect, it } from 'vitest';
import {
  currentStreak,
  intensityLevel,
  isDayComplete,
  overallCompletionRate,
  summarizeByDay,
  trailingDateKeys,
} from '../stats';
import type { Task } from '../../types';

function makeTask(date: string, done: boolean, id = `${date}-${Math.random()}`): Task {
  return { id, title: 'x', date, done, createdAt: 0, updatedAt: 0 };
}

describe('summarizeByDay', () => {
  it('compte le total et le nombre de tâches terminées par jour', () => {
    const tasks: Task[] = [
      makeTask('2024-06-03', true, 'a'),
      makeTask('2024-06-03', false, 'b'),
      makeTask('2024-06-04', true, 'c'),
    ];
    const days = summarizeByDay(tasks, ['2024-06-03', '2024-06-04', '2024-06-05']);
    expect(days).toEqual([
      { date: '2024-06-03', total: 2, done: 1 },
      { date: '2024-06-04', total: 1, done: 1 },
      { date: '2024-06-05', total: 0, done: 0 },
    ]);
  });

  it('ignore les tâches en dehors de la plage demandée', () => {
    const tasks: Task[] = [makeTask('2024-01-01', true, 'a')];
    const days = summarizeByDay(tasks, ['2024-06-03']);
    expect(days[0]).toEqual({ date: '2024-06-03', total: 0, done: 0 });
  });
});

describe('isDayComplete', () => {
  it('est vrai seulement si au moins une tâche existe et que toutes sont validées', () => {
    expect(isDayComplete({ date: 'd', total: 0, done: 0 })).toBe(false);
    expect(isDayComplete({ date: 'd', total: 2, done: 1 })).toBe(false);
    expect(isDayComplete({ date: 'd', total: 2, done: 2 })).toBe(true);
  });
});

describe('currentStreak', () => {
  it('compte les jours complets consécutifs en partant de la fin', () => {
    const days = [
      { date: '06-01', total: 2, done: 2 },
      { date: '06-02', total: 1, done: 1 },
      { date: '06-03', total: 3, done: 1 }, // rompt la série
      { date: '06-04', total: 2, done: 2 },
      { date: '06-05', total: 1, done: 1 },
    ];
    expect(currentStreak(days)).toBe(2);
  });

  it('ignore les jours sans tâche prévue (ils ne cassent pas la série)', () => {
    const days = [
      { date: '06-01', total: 2, done: 2 },
      { date: '06-02', total: 0, done: 0 },
      { date: '06-03', total: 1, done: 1 },
    ];
    expect(currentStreak(days)).toBe(2);
  });

  it('renvoie 0 si le dernier jour avec tâches n’est pas complet', () => {
    const days = [
      { date: '06-01', total: 2, done: 2 },
      { date: '06-02', total: 2, done: 1 },
    ];
    expect(currentStreak(days)).toBe(0);
  });
});

describe('overallCompletionRate', () => {
  it('calcule la proportion globale de tâches terminées', () => {
    const days = [
      { date: 'a', total: 2, done: 1 },
      { date: 'b', total: 2, done: 2 },
    ];
    expect(overallCompletionRate(days)).toBeCloseTo(0.75);
  });

  it('renvoie 0 quand aucune tâche n’existe', () => {
    expect(overallCompletionRate([{ date: 'a', total: 0, done: 0 }])).toBe(0);
  });
});

describe('trailingDateKeys', () => {
  it('génère N clés de date consécutives se terminant par la date de référence', () => {
    const keys = trailingDateKeys(new Date(2024, 5, 5), 3);
    expect(keys).toEqual(['2024-06-03', '2024-06-04', '2024-06-05']);
  });
});

describe('intensityLevel', () => {
  it('mappe le ratio de complétion sur 4 niveaux', () => {
    expect(intensityLevel({ date: 'd', total: 0, done: 0 })).toBe(0);
    expect(intensityLevel({ date: 'd', total: 4, done: 0 })).toBe(0);
    expect(intensityLevel({ date: 'd', total: 4, done: 1 })).toBe(1);
    expect(intensityLevel({ date: 'd', total: 4, done: 3 })).toBe(2);
    expect(intensityLevel({ date: 'd', total: 4, done: 4 })).toBe(3);
  });
});
