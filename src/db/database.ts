import Dexie, { type Table } from 'dexie';
import type { Category, Routine, Task } from '../types';

/**
 * Toutes les données de Cadence vivent uniquement dans IndexedDB, sur l'appareil.
 * Aucune donnée ne quitte le téléphone : pas de serveur, pas de compte.
 */
export class CadenceDB extends Dexie {
  tasks!: Table<Task, string>;
  routines!: Table<Routine, string>;
  categories!: Table<Category, string>;

  constructor(name = 'cadence') {
    super(name);
    this.version(1).stores({
      tasks: 'id, date, done, routineId, categoryId, [date+routineId]',
      routines: 'id',
      categories: 'id',
    });
  }
}

export const db = new CadenceDB();

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'cat-perso', name: 'Personnel', color: 'violet', icon: 'Sparkles' },
  { id: 'cat-sport', name: 'Sport', color: 'mint', icon: 'Dumbbell' },
  { id: 'cat-travail', name: 'Travail', color: 'amber', icon: 'Briefcase' },
  { id: 'cat-maison', name: 'Maison', color: 'coral', icon: 'Home' },
];

let seeded = false;

/** Insère les catégories par défaut au tout premier lancement (idempotent). */
export async function seedDefaultCategories(database: CadenceDB = db): Promise<void> {
  if (seeded) return;
  const count = await database.categories.count();
  if (count > 0) {
    seeded = true;
    return;
  }
  const now = Date.now();
  await database.categories.bulkAdd(DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt: now })));
  seeded = true;
}

/** Pour les tests : permet de réinitialiser le flag de seed entre deux suites. */
export function resetSeedFlagForTests(): void {
  seeded = false;
}
