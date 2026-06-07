import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Category, Project, Task } from '../../types';
import { colorStyle } from '../../lib/categoryStyles';
import { CategoryIcon } from '../../components/CategoryIcon';
import { ConfirmDeleteButton } from '../../components/ConfirmDeleteButton';
import { ProgressRing } from '../../components/ProgressRing';

interface ProjectCardProps {
  project: Project;
  category?: Category;
  tasks: Task[];
  onOpen: (project: Project) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, category, tasks, onOpen, onDelete }: ProjectCardProps) {
  const style = colorStyle(category?.color);
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const ratio = total === 0 ? 0 : done / total;
  const complete = project.completedAt !== undefined;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className={clsx(
        'flex items-center gap-3 rounded-2xl border p-4 transition-colors',
        complete ? 'border-base-700/30 bg-base-800/30' : 'border-base-700/60 bg-base-800/60',
      )}
    >
      <button type="button" onClick={() => onOpen(project)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={clsx('grid size-10 shrink-0 place-items-center rounded-xl', style.soft)}>
          <CategoryIcon name={category?.icon} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={clsx('block truncate text-[15px] font-medium', complete && 'text-base-300 line-through decoration-base-500')}>
            {project.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-base-300">
            {total === 0 ? 'Aucune tâche liée' : `${done} / ${total} tâche${total > 1 ? 's' : ''} validée${done > 1 ? 's' : ''}`}
            {category && <span>· {category.name}</span>}
          </span>
        </span>
        {total > 0 && <ProgressRing value={ratio} size={40} strokeWidth={4} label="" />}
      </button>
      <ConfirmDeleteButton label={`Supprimer le projet "${project.title}"`} onConfirm={() => onDelete(project.id)} />
    </motion.li>
  );
}
