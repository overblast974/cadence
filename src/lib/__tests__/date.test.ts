import { describe, expect, it } from 'vitest';
import { isoWeekday, toDateKey, weekDays } from '../date';

describe('isoWeekday', () => {
  it('renvoie 1 pour lundi et 7 pour dimanche (convention ISO)', () => {
    expect(isoWeekday(new Date(2024, 5, 3))).toBe(1); // lundi
    expect(isoWeekday(new Date(2024, 5, 9))).toBe(7); // dimanche
    expect(isoWeekday(new Date(2024, 5, 6))).toBe(4); // jeudi
  });
});

describe('toDateKey', () => {
  it('formate une date en "yyyy-MM-dd"', () => {
    expect(toDateKey(new Date(2024, 5, 3))).toBe('2024-06-03');
    expect(toDateKey(new Date(2024, 0, 9))).toBe('2024-01-09');
  });
});

describe('weekDays', () => {
  it('renvoie les 7 jours de lundi à dimanche, peu importe le jour de référence', () => {
    // mercredi 5 juin 2024 → semaine du 3 au 9 juin
    const days = weekDays(new Date(2024, 5, 5));
    expect(days).toHaveLength(7);
    expect(toDateKey(days[0])).toBe('2024-06-03');
    expect(toDateKey(days[6])).toBe('2024-06-09');
    expect(isoWeekday(days[0])).toBe(1);
    expect(isoWeekday(days[6])).toBe(7);
  });

  it('renvoie la même semaine si la référence est un dimanche', () => {
    const days = weekDays(new Date(2024, 5, 9));
    expect(toDateKey(days[0])).toBe('2024-06-03');
    expect(toDateKey(days[6])).toBe('2024-06-09');
  });
});
