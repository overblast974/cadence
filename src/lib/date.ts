import {
  addDays,
  format,
  isToday as dfIsToday,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Weekday } from '../types';

export const DATE_FORMAT = 'yyyy-MM-dd';

export function toDateKey(date: Date): string {
  return format(date, DATE_FORMAT);
}

export function fromDateKey(key: string): Date {
  return parseISO(key);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Renvoie le jour ISO (1 = lundi … 7 = dimanche) d'une date. */
export function isoWeekday(date: Date): Weekday {
  const day = date.getDay(); // 0 = dimanche … 6 = samedi
  return (day === 0 ? 7 : day) as Weekday;
}

export function isoWeekdayFromKey(key: string): Weekday {
  return isoWeekday(fromDateKey(key));
}

/** Les 7 jours de la semaine (lundi → dimanche) contenant `date`. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekDayLabel(date: Date): string {
  return format(date, 'EEEE', { locale: fr });
}

export function shortDayLabel(date: Date): string {
  return format(date, 'EEE', { locale: fr });
}

export function dayNumberLabel(date: Date): string {
  return format(date, 'd');
}

export function monthLabel(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: fr });
}

export function fullDateLabel(date: Date): string {
  return format(date, "EEEE d MMMM", { locale: fr });
}

export function isToday(date: Date): boolean {
  return dfIsToday(date);
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
};

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  1: 'L',
  2: 'M',
  3: 'M',
  4: 'J',
  5: 'V',
  6: 'S',
  7: 'D',
};
