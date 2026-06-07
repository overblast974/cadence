import { iconForName } from '../lib/categoryStyles';

interface CategoryIconProps {
  name?: string;
  className?: string;
}

/**
 * Affiche l'icône Lucide associée à un nom de catégorie.
 *
 * `iconForName` pioche dans une table statique (`CATEGORY_ICONS`) : la référence
 * de composant renvoyée pour un même nom est toujours strictement la même d'un
 * rendu à l'autre, donc l'élément ne perd jamais son état. On centralise la
 * sélection ici pour ne déroger qu'à un seul endroit à la règle de lint
 * `react-hooks/static-components`, qui ne peut pas le vérifier statiquement.
 */
/* eslint-disable react-hooks/static-components --
   Référence stable issue d'une table statique (voir le commentaire de la fonction). */
export function CategoryIcon({ name, className }: CategoryIconProps) {
  const Icon = iconForName(name);
  return <Icon className={className} />;
}
/* eslint-enable react-hooks/static-components */
