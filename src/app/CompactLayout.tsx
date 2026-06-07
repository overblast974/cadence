import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { NAV_ITEMS } from './navigation';

/**
 * Mise en page pour les écrans étroits et allongés (téléphones classiques,
 * et écrans de couverture des pliables Z Fold — ~340-415x880-960 CSS px du
 * Fold 4 au Fold 7) : navigation au pouce en bas de l'écran, contenu en
 * une colonne, qui s'étire ou se rétrécit naturellement avec la largeur réelle.
 */
export function CompactLayout() {
  return (
    <div className="flex h-dvh w-full flex-col">
      <main className="flex-1 overflow-y-auto scroll-hidden px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <nav
        aria-label="Navigation principale"
        className="flex shrink-0 items-stretch justify-around border-t border-base-700/60 bg-base-900/90 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent-violet-soft' : 'text-base-300',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx('grid place-items-center rounded-full p-1.5 transition-colors', isActive && 'bg-accent-violet/15')}>
                  <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
