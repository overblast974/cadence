import { useState } from 'react';
import type { Category, Task } from '../types';
import { Sheet } from './Sheet';
import { Field, TextInput, TextArea, CategoryPicker, PrimaryButton, GhostButton } from './FormControls';

interface TaskFormValues {
  title: string;
  date: string;
  time?: string;
  notes?: string;
  categoryId?: string;
}

interface TaskFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
  categories: Category[];
  defaultDate: string;
  task?: Task;
}

export function TaskFormSheet({ open, onClose, onSubmit, categories, defaultDate, task }: TaskFormSheetProps) {
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
          defaultDate={defaultDate}
          task={task}
        />
      )}
    </Sheet>
  );
}

type TaskFormFieldsProps = Omit<TaskFormSheetProps, 'open'>;

function TaskFormFields({ onClose, onSubmit, categories, defaultDate, task }: TaskFormFieldsProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [date, setDate] = useState(task?.date ?? defaultDate);
  const [time, setTime] = useState(task?.time ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [categoryId, setCategoryId] = useState<string | undefined>(task?.categoryId);

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
          <TextInput id="task-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Heure (optionnel)" htmlFor="task-time">
          <TextInput id="task-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      <Field label="Catégorie" htmlFor="task-category">
        <div id="task-category">
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>
      </Field>

      <Field label="Notes (optionnel)" htmlFor="task-notes">
        <TextArea id="task-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails, lien, contexte…" />
      </Field>

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
