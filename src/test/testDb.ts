import { db, resetSeedFlagForTests } from '../db/database';

/**
 * Les composants et hooks importent l'instance singleton `db`. En test, cette
 * instance tourne sur fake-indexeddb (polyfill chargé dans setup.ts) : il
 * suffit donc de la vider entre chaque test pour obtenir un état isolé.
 */
export async function resetDatabase(): Promise<void> {
  resetSeedFlagForTests();
  await db.transaction('rw', db.tasks, db.routines, db.categories, db.projects, async () => {
    await Promise.all([db.tasks.clear(), db.routines.clear(), db.categories.clear(), db.projects.clear()]);
  });
}
