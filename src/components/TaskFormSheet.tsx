import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Category, Project, Task } from '../types';
import { Sheet } from './Sheet';
import { Field, TextInput, TextArea, CategoryPicker, PrimaryButton, GhostButton } from './FormControls';
import { CheckCircle } from './CheckCircle';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { fromDateKey, fullDateLabel } from '../lib/date';
import { useSubtasks } from '../hooks/useCadenceData';
import { createSubtask, deleteTask, toggleTask } from '../db/repository';

interface TaskFormValues {
  title: string;
  date: string;
  time?: string;
  notes?: string;
  categoryId?: string;
  projectId?: string;
}

interface TaskFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
  categories: Category[];
  projects: Project[];
  defaultDate: string;
  task?: Task;
}

export function TaskFormSheet({ open, onClose, onSubmit, categories, projects, defaultDate, task }: TaskFormSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={task ? 'Modifier la tâche' : 'Nouvelle tâche'}>
      {/* La clé force un remontage à chaque ouverture / changement de tâche éditée :
          le formulaire repart toujours d'un état initial propre, sans synchronisation via effet. */}
      {open && (
        <TaskFormFields
          key={task?.id ?? 'new'}
          onClose={onClose}
          onSubmit={onSubmit}
          categories={categories}
          projects={projects}
          defaultDate={defaultDate}
          task={task}
        />
      )}
    </Sheet>
  );
}

type TaskFormFieldsProps = Omit<TaskFormSheetProps, 'open'>;

function TaskFormFields({ onClose, onSubmit, categories, projects, defaultDate, task }: TaskFormFieldsProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [date, setDate] = useState(task?.date ?? defaultDate);
  const [time, setTime] = useState(task?.time ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [categoryId, setCategoryId] = useState<string | undefined>(task?.categoryId);
  const [projectId, setProjectId] = useState<string | undefined>(task?.projectId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({
      title: trimmed,
      date,
      time: time || undefined,
      notes: notes.trim() || undefined,
      categoryId,
      projectId,
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Titre" htmlFor="task-title">
        <TextInput
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Appeler le dentiste"
          autoFocus
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="task-date">
          {task ? (
            <p
              id="task-date"
              className="w-full truncate rounded-xl border border-base-700/60 bg-base-900/30 px-3.5 py-2.5 text-[15px] capitalize text-base-300"
              title="La date d’une tâche ne peut pas être modifiée après sa création."
            >
              {fullDateLabel(fromDateKey(date))}
            </p>
          ) : (
            <TextInput id="task-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          )}
        </Field>
        <Field label="Heure (optionnel)" htmlFor="task-time">
          <TextInput id="task-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      {task && <p className="-mt-2 text-xs text-base-500">La date est figée : crée une nouvelle tâche pour la déplacer à un autre jour.</p>}

      <Field label="Catégorie" htmlFor="task-category">
        <div id="task-category">
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>
      </Field>

      {projects.length > 0 && (
        <Field label="Projet (optionnel)" htmlFor="task-project">
          <select
            id="task-project"
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value || undefined)}
            className="w-full rounded-xl border border-base-700 bg-base-900/60 px-3.5 py-2.5 text-[15px] text-base-50 outline-none transition-colors focus:border-accent-violet-soft focus:ring-2 focus:ring-accent-violet/30"
          >
            <option value="">Aucun</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Notes (optionnel)" htmlFor="task-notes">
        <TextArea id="task-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails, lien, contexte…" />
      </Field>

      {task && !task.parentTaskId && <SubtaskSection parentId={task.id} />}

      <div className="mt-1 flex gap-2">
        <GhostButton type="button" onClick={onClose} className="flex-1">
          Annuler
        </GhostButton>
        <PrimaryButton type="submit" className="flex-1" disabled={!title.trim()}>
          {task ? 'Enregistrer' : 'Ajouter'}
        </PrimaryButton>
      </div>
    </form>
  );
}

/**
 * Checklist de sous-tâches : valider chacune fait progressivement avancer la
 * tâche parente, qui se valide automatiquement une fois toutes complétées.
 */
function SubtaskSection({ parentId }: { parentId: string }) {
  const subtasks = useSubtasks(parentId);
  const [draft, setDraft] = useState('');

  async function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft('');
    await createSubtask(parentId, { title: trimmed });
  }

  return (
    <Field label="Sous-tâches (optionnel)" htmlFor="task-subtask-input">
      <div className="flex flex-col gap-2">
        {subtasks && subtasks.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className="flex items-center gap-2.5 rounded-xl border border-base-700/60 bg-base-900/30 px-3 py-2"
              >
                <CheckCircle
                  done={subtask.done}
                  onToggle={() => void toggleTask(subtask.id)}
                  label={subtask.done ? `Marquer "${subtask.title}" comme à faire` : `Marquer "${subtask.title}" comme fait`}
                  small
                />
                <span className={subtaskTitleClass(subtask.done)}>{subtask.title}</span>
                <ConfirmDeleteButton
                  label={`Supprimer la sous-tâche "${subtask.title}"`}
                  onConfirm={() => void deleteTask(subtask.id)}
                  className="ml-auto shrink-0 !p-1.5"
                />
              </li>
            ))}
          </ul>
        )}
        {/* Un <form> imbriqué dans le formulaire de la tâche serait invalide en HTML
            (et refermerait la feuille au clic) : on gère la saisie sans <form>. */}
        <div className="flex gap-2">
          <TextInput
            id="task-subtask-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleAdd();
              }
            }}
            placeholder="Ajouter une sous-tâche…"
          />
          <GhostButton type="button" onClick={() => void handleAdd()} aria-label="Ajouter la sous-tâche" className="!px-3" disabled={!draft.trim()}>
            <Plus className="size-4" />
          </GhostButton>
        </div>
      </div>
    </Field>
  );
}

function subtaskTitleClass(done: boolean): string {
  return done ? 'truncate text-sm text-base-300 line-through decoration-base-500' : 'truncate text-sm text-base-50';
}
