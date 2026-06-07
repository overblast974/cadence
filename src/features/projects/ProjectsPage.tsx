import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { Category, Project } from '../../types';
import { useCategories, useProjects, useTasksForProject } from '../../hooks/useCadenceData';
import { createProject, deleteProject, deleteTask, toggleTask, updateProject } from '../../db/repository';
import { ProjectCard } from './ProjectCard';
import { ProjectFormSheet } from '../../components/ProjectFormSheet';
import { Sheet } from '../../components/Sheet';
import { TaskRow } from '../../components/TaskRow';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton, GhostButton } from '../../components/FormControls';
import { fullDateLabel, fromDateKey } from '../../lib/date';

export function ProjectsPage() {
  const projects = useProjects();
  const categories = useCategories();
  const categoryById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [viewingId, setViewingId] = useState<string | undefined>(undefined);

  // On dérive les projets affichés depuis la liste vivante plutôt que de garder
  // un instantané : la feuille de détail/édition reste à jour en temps réel
  // (ex. le badge "projet terminé" apparaît dès que la dernière tâche est cochée).
  const editing = useMemo(() => projects?.find((p) => p.id === editingId), [projects, editingId]);
  const viewing = useMemo(() => projects?.find((p) => p.id === viewingId), [projects, viewingId]);

  function openCreate() {
    setEditingId(undefined);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setViewingId(undefined);
    setEditingId(project.id);
    setFormOpen(true);
  }

  async function handleSubmit(values: Parameters<typeof createProject>[0]) {
    if (editing) {
      await updateProject(editing.id, values);
    } else {
      await createProject(values);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header className="flex items-center justify-between gap-3 pt-2">
        <div>
          <p className="text-sm text-base-300">Objectifs au long cours</p>
          <h1 className="text-xl font-semibold tracking-tight">Projets</h1>
          <p className="mt-1 text-sm text-base-300">
            Regroupe plusieurs tâches, parfois réparties sur plusieurs jours : un projet se valide une fois toutes ses tâches terminées.
          </p>
        </div>
      </header>

      <PrimaryButton type="button" onClick={openCreate} className="self-start">
        <Plus className="size-4" /> Nouveau projet
      </PrimaryButton>

      {projects === undefined ? null : projects.length === 0 ? (
        <EmptyState
          title="Aucun projet pour l’instant"
          description="Crée un projet (ex. « Préparer le déménagement ») puis rattache-lui des tâches depuis leur formulaire."
          actionLabel="Créer mon premier projet"
          onAction={openCreate}
        />
      ) : (
        <motion.ul layout className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {projects.map((project) => (
              <ProjectListEntry
                key={project.id}
                project={project}
                categoryById={categoryById}
                onOpen={(p) => setViewingId(p.id)}
                onDelete={(id) => void deleteProject(id)}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <ProjectFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => void handleSubmit(values)}
        categories={categories ?? []}
        project={editing}
      />

      <ProjectDetailSheet
        project={viewing}
        onClose={() => setViewingId(undefined)}
        onEdit={openEdit}
      />
    </div>
  );
}

function ProjectListEntry({
  project,
  categoryById,
  onOpen,
  onDelete,
}: {
  project: Project;
  categoryById: Map<string, Category>;
  onOpen: (project: Project) => void;
  onDelete: (id: string) => void;
}) {
  const tasks = useTasksForProject(project.id);
  return (
    <ProjectCard
      project={project}
      category={categoryById.get(project.categoryId ?? '')}
      tasks={tasks ?? []}
      onOpen={onOpen}
      onDelete={onDelete}
    />
  );
}

function ProjectDetailSheet({
  project,
  onClose,
  onEdit,
}: {
  project: Project | undefined;
  onClose: () => void;
  onEdit: (project: Project) => void;
}) {
  const tasks = useTasksForProject(project?.id);
  const categories = useCategories();
  const categoryById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.done).length ?? 0;

  return (
    <Sheet open={project !== undefined} onClose={onClose} title={project?.title ?? 'Projet'}>
      {project && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-base-300">
              {tasks === undefined
                ? ' '
                : total === 0
                  ? 'Aucune tâche liée pour le moment.'
                  : `${done} / ${total} tâche${total > 1 ? 's' : ''} validée${total > 1 ? 's' : ''}${project.completedAt ? ' · projet terminé 🎉' : ''}`}
            </p>
            <GhostButton type="button" onClick={() => onEdit(project)} className="!px-3 !py-1.5 text-sm">
              Modifier
            </GhostButton>
          </div>

          {project.notes && <p className="rounded-xl border border-base-700/60 bg-base-900/30 p-3 text-sm text-base-300">{project.notes}</p>}

          {tasks === undefined ? null : tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-base-700/60 px-3 py-6 text-center text-sm text-base-500">
              Rattache des tâches à ce projet depuis leur formulaire (« Projet »).
            </p>
          ) : (
            <motion.ul layout className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {tasks.map((task) => (
                  <div key={task.id} className="flex flex-col gap-1">
                    <p className="px-1 text-xs capitalize text-base-500">{fullDateLabel(fromDateKey(task.date))}</p>
                    <TaskRow
                      task={task}
                      category={categoryById.get(task.categoryId ?? '')}
                      onToggle={(id) => void toggleTask(id)}
                      onDelete={(id) => void deleteTask(id)}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      )}
    </Sheet>
  );
}
