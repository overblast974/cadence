import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import clsx from 'clsx';

interface CheckCircleProps {
  done: boolean;
  onToggle: () => void;
  colorClass?: string;
  label: string;
  small?: boolean;
}

/** Case à cocher circulaire animée — le cœur de l'interaction "valider une tâche". */
export function CheckCircle({ done, onToggle, colorClass = 'bg-accent-violet', label, small }: CheckCircleProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      aria-label={label}
      whileTap={{ scale: 0.85 }}
      className={clsx(
        'relative grid shrink-0 place-items-center rounded-full border-2 transition-colors',
        small ? 'size-6' : 'size-9',
        done ? clsx(colorClass, 'border-transparent') : 'border-base-500 bg-transparent',
      )}
    >
      <motion.span
        initial={false}
        animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <Check className={clsx(small ? 'size-3.5' : 'size-5', 'text-base-950')} strokeWidth={3} />
      </motion.span>
    </motion.button>
  );
}
