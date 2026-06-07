/** Jour ISO : 1 = lundi … 7 = dimanche */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Category {
  id: string;
  name: string;
  /** Token de couleur : violet | coral | amber | mint | … */
  color: string;
  /** Nom d'icône Lucide */
  icon: string;
  createdAt: number;
}

export interface Routine {
  id: string;
  title: string;
  notes?: string;
  /** Heure indicative au format "HH:mm" */
  time?: string;
  daysOfWeek: Weekday[];
  categoryId?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  /** Date au format "YYYY-MM-DD" */
  date: string;
  /** Heure indicative au format "HH:mm" */
  time?: string;
  done: boolean;
  completedAt?: number;
  categoryId?: string;
  /** Présent si la tâche a été générée depuis une routine */
  routineId?: string;
  createdAt: number;
  updatedAt: number;
}

export type ViewportMode = 'compact' | 'expanded';
