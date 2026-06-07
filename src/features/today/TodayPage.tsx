import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCategories, useProjects, useTasksForDate } from '../../hooks/useCadenceData';
import { fullDateLabel, todayKey } from '../../lib/date';
import { createTask, deleteTask, toggleTask, updateTask } from '../../db/repository';
import type { Task } from '../../types';
import { TaskRow } from '../../components/TaskRow';
import { ProgressRing } from '../../components/ProgressRing';
import { Confetti } from '../../components/Confetti';
import { TaskFormSheet } from '../../components/TaskFormSheet';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/FormControls';

export function TodayPage() {
  const date = useMemo(() => todayKey(), []);
  const tasks = useTasksForDate(date);
  const categories = useCategories();
  const projects = useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>(undefined);
  const [celebration, setCelebration] = useState(0);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setFormOpen(true);
  }

  async function handleSubmit(values: Parameters<typeof createTask>[0]) {
    if (editing) {
      await updateTask(editing.id, values);
    } else {
      await createTask(values);
    }
  }

  const categoryById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.done).length ?? 0;
  const ratio = total === 0 ? 0 : done / total;

  async function handleToggle(id: string) {
    if (tasks && total > 0) {
      const wasAllDone = done === total;
      const willBeDoneCount = tasks.filter((t) => (t.id === id ? !t.done : t.done)).length;
      if (!wasAllDone && willBeDoneCount === total) {
        setCelebration((c) => c + 1);
      }
    }
    await toggleTask(id);
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header className="relative flex items-center justify-between gap-4 pt-2">
        <Confetti burstKey={celebration} />
        <div>
          <p className="text-sm text-base-300">Aujourd’hui</p>
          <h1 className="text-xl font-semibold capitalize tracking-tight">{fullDateLabel(new Date())}</h1>
          <p className="mt-1 text-sm text-base-300">
            {total === 0 ? 'Aucune tâche prévue — profite-en !' : `${done} / ${total} tâche${total > 1 ? 's' : ''} validée${done > 1 ? 's' : ''}`}
          </p>
        </div>
        {total > 0 && <ProgressRing value={ratio} size={72} strokeWidth={7} />}
      </header>

      {tasks === undefined ? null : tasks.length === 0 ? (
        <EmptyState
          title="Rien au programme"
          description="Ajoute une tâche ou crée une routine pour qu'elle apparaisse ici automatiquement chaque semaine."
          actionLabel="Ajouter une tâche"
          onAction={openCreate}
        />
      ) : (
        <motion.ul layout className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                category={categoryById.get(task.categoryId ?? '')}
                onToggle={handleToggle}
                onDelete={(id) => void deleteTask(id)}
                onOpen={openEdit}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {tasks && tasks.length > 0 && (
        <PrimaryButton type="button" onClick={openCreate} className="self-start">
          <Plus className="size-4" /> Ajouter une tâche
        </PrimaryButton>
      )}

      <TaskFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => void handleSubmit(values)}
        categories={categories ?? []}
        projects={projects ?? []}
        defaultDate={date}
        task={editing}
      />
    </div>
  );
}
