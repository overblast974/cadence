import { useEffect, useState } from 'react';
import type { ViewportMode } from '../types';

/**
 * Les pliables (Z Fold 4 à 7, et la plupart des autres) ne changent pas de
 * "device" entre les deux écrans : la page est réellement redimensionnée
 * (un `resize` natif se déclenche). On détecte donc le format à partir de la
 * largeur réelle du viewport ET de son ratio plutôt que de comparer à une
 * liste de résolutions exactes — ce qui généralise à toute la gamme (et aux
 * futurs modèles) sans avoir à la maintenir. Les deux écrans suivent en effet
 * la même tendance d'une génération à l'autre :
 *  - écran de couverture : étroit et très allongé   (~340-415 x 880-960 CSS px,
 *    ratio ~0.39-0.43 du Fold 4 au Fold 7)
 *  - écran principal ouvert : large et presque carré (~690-750 x 820-830 CSS px,
 *    ratio ~0.83-0.90 du Fold 4 au Fold 7)
 * Les seuils ci-dessous se situent confortablement entre ces deux familles de
 * valeurs (largeur : ~415 max en couverture vs ~690 min ouvert ; ratio : ~0.43
 * max en couverture vs ~0.83 min ouvert), avec une marge suffisante pour
 * absorber les variations de futurs modèles sans déclencher un mauvais layout.
 */
const COMPACT_MAX_WIDTH = 540;
const EXPANDED_MIN_RATIO = 0.68; // largeur / hauteur

export function computeViewportMode(width: number, height: number): ViewportMode {
  const ratio = height === 0 ? 1 : width / height;
  if (width >= COMPACT_MAX_WIDTH && ratio >= EXPANDED_MIN_RATIO) {
    return 'expanded';
  }
  return 'compact';
}

function readViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 360, height: 800 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>(() => {
    const { width, height } = readViewport();
    return computeViewportMode(width, height);
  });

  useEffect(() => {
    function handleResize() {
      const { width, height } = readViewport();
      setMode(computeViewportMode(width, height));
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return mode;
}
