import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { useBootstrapDatabase } from './hooks/useCadenceData';

// La page "Aujourd'hui" est l'écran de démarrage : elle reste dans le bundle
// principal. Les autres sont chargées à la demande pour garder un premier
// chargement léger sur mobile (PWA installée hors-ligne après le 1er visit).
import { TodayPage } from './features/today/TodayPage';
const WeekPage = lazy(() => import('./features/week/WeekPage').then((m) => ({ default: m.WeekPage })));
const RoutinesPage = lazy(() => import('./features/routines/RoutinesPage').then((m) => ({ default: m.RoutinesPage })));
const StatsPage = lazy(() => import('./features/stats/StatsPage').then((m) => ({ default: m.StatsPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

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
