import { useEffect, useState } from 'react';
import type { ViewportMode } from '../types';

/**
 * Le Z Fold 4 (et les pliables en général) ne changent pas de "device" entre
 * les deux écrans : la page est réellement redimensionnée (un `resize` natif
 * se déclenche). On détecte donc le format à partir de la largeur réelle du
 * viewport ET de son ratio, ce qui permet de distinguer :
 *  - écran de couverture : étroit et très allongé   (~344 x 882 CSS px)
 *  - écran principal ouvert : large et presque carré (~690 x 830 CSS px)
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
