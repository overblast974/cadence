import { useState } from 'react';
import type { Category, Routine, Weekday } from '../types';
import { Sheet } from './Sheet';
import { Field, TextInput, TextArea, CategoryPicker, WeekdayPicker, PrimaryButton, GhostButton } from './FormControls';

interface RoutineFormValues {
  title: string;
  daysOfWeek: Weekday[];
  time?: string;
  notes?: string;
  categoryId?: string;
}

interface RoutineFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: RoutineFormValues) => void;
  categories: Category[];
  routine?: Routine;
}

export function RoutineFormSheet({ open, onClose, onSubmit, categories, routine }: RoutineFormSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={routine ? 'Modifier la routine' : 'Nouvelle routine'}>
      {/* La clé force un remontage propre à chaque ouverture / changement de routine éditée. */}
      {open && (
        <RoutineFormFields
          key={routine?.id ?? 'new'}
          onClose={onClose}
          onSubmit={onSubmit}
          categories={categories}
          routine={routine}
        />
      )}
    </Sheet>
  );
}

type RoutineFormFieldsProps = Omit<RoutineFormSheetProps, 'open'>;

function RoutineFormFields({ onClose, onSubmit, categories, routine }: RoutineFormFieldsProps) {
  const [title, setTitle] = useState(routine?.title ?? '');
  const [days, setDays] = useState<Weekday[]>(routine?.daysOfWeek ?? []);
  const [time, setTime] = useState(routine?.time ?? '');
  const [notes, setNotes] = useState(routine?.notes ?? '');
  const [categoryId, setCategoryId] = useState<string | undefined>(routine?.categoryId);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (days.length === 0) {
      setError('Choisis au moins un jour de la semaine.');
      return;
    }
    onSubmit({
      title: trimmed,
      daysOfWeek: days,
      time: time || undefined,
      notes: notes.trim() || undefined,
      categoryId,
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Titre" htmlFor="routine-title">
        <TextInput
          id="routine-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Étirements du matin"
          autoFocus
          required
        />
      </Field>

      <Field label="Répéter ces jours-ci" htmlFor="routine-days">
        <div id="routine-days">
          <WeekdayPicker value={days} onChange={(d) => { setDays(d); setError(null); }} />
          {error && <p className="mt-2 text-xs text-accent-coral">{error}</p>}
        </div>
      </Field>

      <Field label="Heure (optionnel)" htmlFor="routine-time">
        <TextInput id="routine-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="max-w-[10rem]" />
      </Field>

      <Field label="Catégorie" htmlFor="routine-category">
        <div id="routine-category">
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>
      </Field>

      <Field label="Notes (optionnel)" htmlFor="routine-notes">
        <TextArea id="routine-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails, objectif, contexte…" />
      </Field>

      <div className="mt-1 flex gap-2">
        <GhostButton type="button" onClick={onClose} className="flex-1">
          Annuler
        </GhostButton>
        <PrimaryButton type="submit" className="flex-1" disabled={!title.trim()}>
          {routine ? 'Enregistrer' : 'Créer'}
        </PrimaryButton>
      </div>
    </form>
  );
}
