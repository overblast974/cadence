import { useState } from 'react';
import type { Category, Project } from '../types';
import { Sheet } from './Sheet';
import { Field, TextInput, TextArea, CategoryPicker, PrimaryButton, GhostButton } from './FormControls';

interface ProjectFormValues {
  title: string;
  notes?: string;
  categoryId?: string;
}

interface ProjectFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
  categories: Category[];
  project?: Project;
}

export function ProjectFormSheet({ open, onClose, onSubmit, categories, project }: ProjectFormSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={project ? 'Modifier le projet' : 'Nouveau projet'}>
      {/* La clé force un remontage propre à chaque ouverture / changement de projet édité. */}
      {open && (
        <ProjectFormFields
          key={project?.id ?? 'new'}
          onClose={onClose}
          onSubmit={onSubmit}
          categories={categories}
          project={project}
        />
      )}
    </Sheet>
  );
}

type ProjectFormFieldsProps = Omit<ProjectFormSheetProps, 'open'>;

function ProjectFormFields({ onClose, onSubmit, categories, project }: ProjectFormFieldsProps) {
  const [title, setTitle] = useState(project?.title ?? '');
  const [notes, setNotes] = useState(project?.notes ?? '');
  const [categoryId, setCategoryId] = useState<string | undefined>(project?.categoryId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({
      title: trimmed,
      notes: notes.trim() || undefined,
      categoryId,
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Titre" htmlFor="project-title">
        <TextInput
          id="project-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Préparer le déménagement"
          autoFocus
          required
        />
      </Field>

      <Field label="Catégorie" htmlFor="project-category">
        <div id="project-category">
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>
      </Field>

      <Field label="Notes (optionnel)" htmlFor="project-notes">
        <TextArea id="project-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails, objectif, contexte…" />
      </Field>

      <div className="mt-1 flex gap-2">
        <GhostButton type="button" onClick={onClose} className="flex-1">
          Annuler
        </GhostButton>
        <PrimaryButton type="submit" className="flex-1" disabled={!title.trim()}>
          {project ? 'Enregistrer' : 'Créer'}
        </PrimaryButton>
      </div>
    </form>
  );
}
