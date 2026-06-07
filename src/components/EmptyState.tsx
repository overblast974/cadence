import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { PrimaryButton } from './FormControls';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-base-700 bg-base-800/40 px-6 py-10 text-center"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-accent-violet/15 text-accent-violet-soft">
        <Sparkles className="size-6" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-xs text-sm text-base-300">{description}</p>
      {actionLabel && onAction && (
        <PrimaryButton type="button" onClick={onAction} className="mt-1">
          {actionLabel}
        </PrimaryButton>
      )}
    </motion.div>
  );
}
