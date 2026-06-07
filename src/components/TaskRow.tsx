import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Category, Task } from '../types';
import { CheckCircle } from './CheckCircle';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { CategoryIcon } from './CategoryIcon';
import { colorStyle } from '../lib/categoryStyles';

interface TaskRowProps {
  task: Task;
  category?: Category;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen?: (task: Task) => void;
  /** Rendu condensé pour les colonnes étroites (planning de la semaine) : pas de bouton de suppression ni de sous-titre. */
  compact?: boolean;
}

export function TaskRow({ task, category, onToggle, onDelete, onOpen, compact }: TaskRowProps) {
  const style = colorStyle(category?.color);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className={clsx(
        'group flex min-w-0 items-center rounded-2xl border border-base-700/60 bg-base-800/60 backdrop-blur-sm transition-colors',
        compact ? 'gap-2 p-2' : 'gap-3 p-3',
        task.done && 'border-base-700/30 bg-base-800/30',
      )}
    >
      <CheckCircle
        done={task.done}
        onToggle={() => onToggle(task.id)}
        colorClass={style.solid}
        label={task.done ? `Marquer "${task.title}" comme à faire` : `Marquer "${task.title}" comme fait`}
        small={compact}
      />

      <button
        type="button"
        onClick={() => onOpen?.(task)}
        className="flex min-w-0 flex-1 flex-col items-start text-left"
      >
        <span
          className={clsx(
            'w-full truncate font-medium transition-colors',
            compact ? 'text-xs' : 'text-[15px]',
            task.done ? 'text-base-300 line-through decoration-base-500' : 'text-base-50',
          )}
        >
          {task.title}
        </span>
        {!compact && (
          <span className="mt-0.5 flex w-full min-w-0 items-center gap-1.5 text-xs text-base-300">
            {task.time && <span className="tabular-nums">{task.time}</span>}
            {category && (
              <span className={clsx('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5', style.soft)}>
                <CategoryIcon name={category.icon} className="size-3" />
                {category.name}
              </span>
            )}
            {task.routineId && <span className="text-base-500">· routine</span>}
          </span>
        )}
      </button>

      {!compact && <ConfirmDeleteButton label={`Supprimer "${task.title}"`} onConfirm={() => onDelete(task.id)} />}
    </motion.li>
  );
}
