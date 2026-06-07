import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Category, Routine } from '../../types';
import { WEEKDAY_SHORT_LABELS } from '../../lib/date';
import { colorStyle } from '../../lib/categoryStyles';
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton';
import { CategoryIcon } from '../../components/CategoryIcon';

interface RoutineCardProps {
  routine: Routine;
  category?: Category;
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (id: string) => void;
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export function RoutineCard({ routine, category, onToggleActive, onEdit, onDelete }: RoutineCardProps) {
  const style = colorStyle(category?.color);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className={clsx(
        'flex flex-col gap-3 rounded-2xl border p-4 transition-colors',
        routine.active ? 'border-base-700/60 bg-base-800/60' : 'border-base-700/30 bg-base-800/25',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onEdit(routine)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className={clsx('mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl', style.soft)}>
            <CategoryIcon name={category?.icon} className="size-4.5" />
          </span>
          <span className="min-w-0">
            <span className={clsx('block truncate text-[15px] font-medium', !routine.active && 'text-base-400')}>{routine.title}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-base-300">
              {routine.time && <span className="tabular-nums">{routine.time}</span>}
              {category && <span>{category.name}</span>}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            role="switch"
            aria-checked={routine.active}
            aria-label={routine.active ? `Désactiver ${routine.title}` : `Activer ${routine.title}`}
            onClick={() => onToggleActive(routine.id, !routine.active)}
            className={clsx(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors',
              routine.active ? 'bg-accent-violet' : 'bg-base-700',
            )}
          >
            <motion.span
              layout
              className="absolute top-0.5 size-5 rounded-full bg-base-50 shadow-sm"
              animate={{ left: routine.active ? '1.375rem' : '0.125rem' }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            />
          </button>
          <ConfirmDeleteButton label={`Supprimer la routine "${routine.title}"`} onConfirm={() => onDelete(routine.id)} />
        </div>
      </div>

      <div className="flex gap-1.5" aria-label="Jours actifs">
        {ALL_DAYS.map((day) => {
          const active = routine.daysOfWeek.includes(day);
          return (
            <span
              key={day}
              className={clsx(
                'grid size-7 place-items-center rounded-full text-xs font-medium',
                active ? clsx(style.soft) : 'bg-base-700/30 text-base-500',
              )}
            >
              {WEEKDAY_SHORT_LABELS[day]}
            </span>
          );
        })}
      </div>
    </motion.li>
  );
}
