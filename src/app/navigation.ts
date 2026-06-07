import { CalendarDays, ListChecks, Repeat, Settings, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Aujourd’hui', icon: ListChecks },
  { to: '/semaine', label: 'Semaine', icon: CalendarDays },
  { to: '/routines', label: 'Routines', icon: Repeat },
  { to: '/stats', label: 'Progrès', icon: Sparkles },
  { to: '/reglages', label: 'Réglages', icon: Settings },
];
