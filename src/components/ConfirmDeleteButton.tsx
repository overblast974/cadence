import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Check } from 'lucide-react';
import clsx from 'clsx';

interface ConfirmDeleteButtonProps {
  label: string;
  onConfirm: () => void;
  className?: string;
}

const ARM_TIMEOUT_MS = 2600;

/**
 * Bouton de suppression à double-tap : un premier appui "arme" le bouton
 * (il se transforme en confirmation pendant ~2.5s), un second appui supprime.
 * Évite une boîte de dialogue modale intrusive tout en protégeant d'un tap accidentel.
 */
export function ConfirmDeleteButton({ label, onConfirm, className }: ConfirmDeleteButtonProps) {
  const [armed, setArmed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  function handleClick() {
    if (armed) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setArmed(false);
      onConfirm();
      return;
    }
    setArmed(true);
    timeoutRef.current = setTimeout(() => setArmed(false), ARM_TIMEOUT_MS);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={armed ? `Confirmer la suppression : ${label}` : label}
      className={clsx(
        'relative grid place-items-center overflow-hidden rounded-full p-2 transition-colors',
        armed ? 'bg-accent-coral/20 text-accent-coral' : 'text-base-500/70 hover:bg-base-700/60 hover:text-accent-coral',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {armed ? (
          <motion.span
            key="confirm"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-1 px-1 text-xs font-medium"
          >
            <Check className="size-3.5" /> Confirmer
          </motion.span>
        ) : (
          <motion.span
            key="trash"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <Trash2 className="size-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
