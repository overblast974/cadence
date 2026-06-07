import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { Routine } from '../../types';
import { useCategories, useRoutines } from '../../hooks/useCadenceData';
import { createRoutine, deleteRoutine, ensureRoutineInstances, updateRoutine } from '../../db/repository';
import { RoutineCard } from './RoutineCard';
import { RoutineFormSheet } from '../../components/RoutineFormSheet';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/FormControls';

export function RoutinesPage() {
  const routines = useRoutines();
  const categories = useCategories();
  const categoryById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Routine | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(routine: Routine) {
    setEditing(routine);
    setFormOpen(true);
  }

  async function handleSubmit(values: Parameters<typeof createRoutine>[0]) {
    if (editing) {
      await updateRoutine(editing.id, values);
    } else {
      await createRoutine(values);
    }
    await ensureRoutineInstances();
  }

  async function handleToggleActive(id: string, active: boolean) {
    await updateRoutine(id, { active });
    await ensureRoutineInstances();
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header className="flex items-center justify-between gap-3 pt-2">
        <div>
          <p className="text-sm text-base-300">Habitudes récurrentes</p>
          <h1 className="text-xl font-semibold tracking-tight">Routines</h1>
          <p className="mt-1 text-sm text-base-300">
            Une routine génère automatiquement une tâche chaque jour où elle est programmée.
          </p>
        </div>
      </header>

      <PrimaryButton type="button" onClick={openCreate} className="self-start">
        <Plus className="size-4" /> Nouvelle routine
      </PrimaryButton>

      {routines === undefined ? null : routines.length === 0 ? (
        <EmptyState
          title="Aucune routine pour l’instant"
          description="Crée une routine (ex. « Sport tous les lundis et jeudis ») et elle apparaîtra automatiquement dans ton planning."
          actionLabel="Créer ma première routine"
          onAction={openCreate}
        />
      ) : (
        <motion.ul layout className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {routines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                category={categoryById.get(routine.categoryId ?? '')}
                onToggleActive={(id, active) => void handleToggleActive(id, active)}
                onEdit={openEdit}
                onDelete={(id) => void deleteRoutine(id)}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <RoutineFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => void handleSubmit(values)}
        categories={categories ?? []}
        routine={editing}
      />
    </div>
  );
}
