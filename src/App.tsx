import { lazy, Suspense, type ComponentType } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { useBootstrapDatabase } from './hooks/useCadenceData';

const CHUNK_RELOAD_KEY = 'cadence-chunk-reload';

/**
 * Après une mise à jour déployée, le service worker peut encore servir un
 * `index.html` référençant un fragment de code dont le hash n'existe plus
 * côté serveur : le `import()` échoue et React démonte tout l'arbre, laissant
 * un écran vide. On tente alors un rechargement automatique unique (le verrou
 * en sessionStorage évite une boucle infinie si l'échec persiste) — l'usager
 * n'a ainsi pas besoin d'intervenir pour retrouver une page fonctionnelle.
 */
function lazyWithReload<T extends ComponentType<unknown>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return mod;
    } catch (error) {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

// La page "Aujourd'hui" est l'écran de démarrage : elle reste dans le bundle
// principal. Les autres sont chargées à la demande pour garder un premier
// chargement léger sur mobile (PWA installée hors-ligne après le 1er visit).
import { TodayPage } from './features/today/TodayPage';
const WeekPage = lazyWithReload(() => import('./features/week/WeekPage').then((m) => ({ default: m.WeekPage })));
const RoutinesPage = lazyWithReload(() => import('./features/routines/RoutinesPage').then((m) => ({ default: m.RoutinesPage })));
const ProjectsPage = lazyWithReload(() => import('./features/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const StatsPage = lazyWithReload(() => import('./features/stats/StatsPage').then((m) => ({ default: m.StatsPage })));
const SettingsPage = lazyWithReload(() => import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

function PageFallback() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-base-400">
      Chargement…
    </div>
  );
}

function App() {
  useBootstrapDatabase();

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route
          path="semaine"
          element={
            <Suspense fallback={<PageFallback />}>
              <WeekPage />
            </Suspense>
          }
        />
        <Route
          path="routines"
          element={
            <Suspense fallback={<PageFallback />}>
              <RoutinesPage />
            </Suspense>
          }
        />
        <Route
          path="projets"
          element={
            <Suspense fallback={<PageFallback />}>
              <ProjectsPage />
            </Suspense>
          }
        />
        <Route
          path="stats"
          element={
            <Suspense fallback={<PageFallback />}>
              <StatsPage />
            </Suspense>
          }
        />
        <Route
          path="reglages"
          element={
            <Suspense fallback={<PageFallback />}>
              <SettingsPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
