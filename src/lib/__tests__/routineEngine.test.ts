import { describe, expect, it } from 'vitest';
import {
  buildTaskFromRoutine,
  missingInstances,
  plannedDatesForRoutine,
  plannedInstances,
} from '../routineEngine';
import type { Routine, Task } from '../../types';

function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'r1',
    title: 'Sport',
    daysOfWeek: [1, 4], // lundi, jeudi
    active: true,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('plannedDatesForRoutine', () => {
  it('renvoie les dates correspondant aux jours de la semaine choisis', () => {
    // 2024-06-03 = lundi, 2024-06-09 = dimanche
    const dates = plannedDatesForRoutine(makeRoutine(), new Date(2024, 5, 3), new Date(2024, 5, 9));
    expect(dates).toEqual(['2024-06-03', '2024-06-06']);
  });

  it('renvoie un tableau vide pour une routine inactive', () => {
    const dates = plannedDatesForRoutine(makeRoutine({ active: false }), new Date(2024, 5, 3), new Date(2024, 5, 9));
    expect(dates).toEqual([]);
  });

  it('renvoie un tableau vide quand aucun jour n’est sélectionné', () => {
    const dates = plannedDatesForRoutine(makeRoutine({ daysOfWeek: [] }), new Date(2024, 5, 3), new Date(2024, 5, 9));
    expect(dates).toEqual([]);
  });

  it('gère une plage à cheval sur plusieurs semaines', () => {
    const dates = plannedDatesForRoutine(
      makeRoutine({ daysOfWeek: [7] }), // dimanche uniquement
      new Date(2024, 5, 1),
      new Date(2024, 5, 16),
    );
    expect(dates).toEqual(['2024-06-02', '2024-06-09', '2024-06-16']);
  });
});

describe('plannedInstances', () => {
  it('agrège les occurrences de plusieurs routines', () => {
    const routines = [
      makeRoutine({ id: 'a', daysOfWeek: [1] }),
      makeRoutine({ id: 'b', daysOfWeek: [3] }),
    ];
    const instances = plannedInstances(routines, new Date(2024, 5, 3), new Date(2024, 5, 5));
    expect(instances).toEqual([
      { routineId: 'a', date: '2024-06-03' },
      { routineId: 'b', date: '2024-06-05' },
    ]);
  });
});

describe('missingInstances', () => {
  it('ne renvoie que les occurrences absentes des tâches existantes', () => {
    const planned = [
      { routineId: 'a', date: '2024-06-03' },
      { routineId: 'a', date: '2024-06-10' },
      { routineId: 'b', date: '2024-06-03' },
    ];
    const existing: Task[] = [
      {
        id: 't1',
        title: 'Sport',
        date: '2024-06-03',
        done: false,
        routineId: 'a',
        createdAt: 0,
        updatedAt: 0,
      },
    ];
    expect(missingInstances(planned, existing)).toEqual([
      { routineId: 'a', date: '2024-06-10' },
      { routineId: 'b', date: '2024-06-03' },
    ]);
  });

  it('renvoie tout quand rien n’existe encore', () => {
    const planned = [{ routineId: 'a', date: '2024-06-03' }];
    expect(missingInstances(planned, [])).toEqual(planned);
  });
});

describe('buildTaskFromRoutine', () => {
  it('construit une tâche reprenant les attributs de la routine', () => {
    const routine = makeRoutine({ time: '07:30', notes: 'Ne pas oublier les baskets', categoryId: 'cat-sport' });
    const task = buildTaskFromRoutine(routine, '2024-06-03', () => 'fixed-id');

    expect(task).toMatchObject({
      id: 'fixed-id',
      title: 'Sport',
      date: '2024-06-03',
      time: '07:30',
      notes: 'Ne pas oublier les baskets',
      categoryId: 'cat-sport',
      routineId: 'r1',
      done: false,
    });
    expect(task.completedAt).toBeUndefined();
  });
});
