import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { Category, Task } from '../../types';
import { dayNumberLabel, isToday, shortDayLabel, weekDayLabel } from '../../lib/date';
import { TaskRow } from '../../components/TaskRow';

interface WeekDayColumnProps {
  date: Date;
  tasks: Task[];
  categoryById: Map<string, Category>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (task: Task) => void;
  onAdd: (date: Date) => void;
  compact?: boolean;
}

export function WeekDayColumn({ date, tasks, categoryById, onToggle, onDelete, onOpen, onAdd, compact }: WeekDayColumnProps) {
  const today = isToday(date);
  const done = tasks.filter((t) => t.done).length;
  // En grille (écran déplié), les colonnes sont étroites : on condense les lignes de tâche.
  const narrowColumn = !compact;

  return (
    <div
      className={clsx(
        'flex flex-col gap-2.5 rounded-2xl border p-3',
        today ? 'border-accent-violet/50 bg-accent-violet/[0.06]' : 'border-base-700/50 bg-base-800/40',
        compact ? 'min-w-0' : 'w-[9.5rem] shrink-0 snap-start min-h-[20rem]',
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={clsx('text-xs font-medium capitalize', today ? 'text-accent-violet-soft' : 'text-base-300')}>
            {compact ? weekDayLabel(date) : shortDayLabel(date)}
          </p>
          <p className="text-lg font-semibold tabular-nums">{dayNumberLabel(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <span className="rounded-full bg-base-700/60 px-2 py-0.5 text-[11px] tabular-nums text-base-300">
              {done}/{tasks.length}
            </span>
          )}
          <button
            type="button"
            onClick={() => onAdd(date)}
            aria-label={`Ajouter une tâche le ${weekDayLabel(date)} ${dayNumberLabel(date)}`}
            className="grid size-7 place-items-center rounded-full text-base-400 transition-colors hover:bg-base-700/60 hover:text-accent-violet-soft"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-base-700/60 px-3 py-4 text-center text-xs text-base-500">
          Rien de prévu
        </p>
      ) : (
        <motion.ul layout className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                category={categoryById.get(task.categoryId ?? '')}
                onToggle={onToggle}
                onDelete={onDelete}
                onOpen={onOpen}
                compact={narrowColumn}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
