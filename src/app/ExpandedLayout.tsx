import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { NAV_ITEMS } from './navigation';

/**
 * Mise en page pour les écrans larges et presque carrés (écran principal des
 * pliables Z Fold déplié — ~690-750x820-830 CSS px du Fold 4 au Fold 7 — ou
 * mini-tablette) : rail de navigation latéral façon tablette de largeur fixe,
 * contenu fluide (`flex-1`, `max-w-4xl` centré) qui absorbe l'écart de largeur
 * entre modèles sans qu'aucune valeur ne soit câblée en dur sur un format précis.
 */
export function ExpandedLayout() {
  return (
    <div className="flex h-dvh w-full">
      <nav
        aria-label="Navigation principale"
        className="flex w-[15.5rem] shrink-0 flex-col gap-1 border-r border-base-700/60 bg-base-900/70 p-4 pt-[max(1.25rem,env(safe-area-inset-top))]"
      >
        <div className="mb-4 flex items-center gap-2 px-2">
          <span className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-accent-violet to-accent-coral font-bold text-base-950">
            C
          </span>
          <span className="text-lg font-semibold tracking-tight">Cadence</span>
        </div>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors',
                isActive ? 'bg-accent-violet/15 text-accent-violet-soft' : 'text-base-300 hover:bg-base-800 hover:text-base-50',
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 overflow-y-auto scroll-hidden px-8 py-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
