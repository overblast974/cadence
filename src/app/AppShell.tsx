import { AnimatePresence, motion } from 'framer-motion';
import { useViewportMode } from '../hooks/useViewportMode';
import { CompactLayout } from './CompactLayout';
import { ExpandedLayout } from './ExpandedLayout';

/**
 * Choisit dynamiquement la mise en page adaptée au format physique de l'écran
 * (cf. useViewportMode — l'heuristique largeur/ratio couvre toute la gamme
 * Z Fold 4 à 7, et plus généralement tout pliable au même type de proportions).
 * Sur un pliable, le passage de l'un à l'autre se produit en cours d'usage
 * (l'utilisateur déplie le téléphone) : on anime donc la transition pour que
 * le changement de mise en page semble accompagner le geste plutôt que de "sauter".
 */
export function AppShell() {
  const mode = useViewportMode();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="h-dvh w-full"
        data-viewport-mode={mode}
      >
        {mode === 'expanded' ? <ExpandedLayout /> : <CompactLayout />}
      </motion.div>
    </AnimatePresence>
  );
}
