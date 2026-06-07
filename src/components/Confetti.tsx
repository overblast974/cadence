import { useMemo } from 'react';

interface ConfettiProps {
  /** Incrémenter cette valeur déclenche une nouvelle salve de confettis. */
  burstKey: number;
}

const COLORS = ['#8b5cf6', '#f97373', '#fbbf66', '#5eead4', '#a78bfa'];
const PIECE_COUNT = 18;

/**
 * Petit générateur pseudo-aléatoire déterministe (mulberry32).
 * Les composants doivent rester purs : on dérive le "hasard" visuel uniquement
 * de `burstKey` et de l'index de la pièce, plutôt que d'appeler `Math.random`
 * pendant le rendu (ce qui produirait un résultat différent à chaque re-rendu).
 */
function seededRandom(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Petite pluie de confettis CSS — récompense ludique quand toutes les tâches du jour sont validées. */
export function Confetti({ burstKey }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => {
        const r1 = seededRandom(burstKey * 1000 + i * 3 + 1);
        const r2 = seededRandom(burstKey * 1000 + i * 3 + 2);
        const r3 = seededRandom(burstKey * 1000 + i * 3 + 3);
        return {
          id: `${burstKey}-${i}`,
          left: `${(i / PIECE_COUNT) * 100 + (r1 * 6 - 3)}%`,
          delay: r2 * 250,
          color: COLORS[i % COLORS.length],
          rotate: r3 * 360,
        };
      }),
    [burstKey],
  );

  if (burstKey === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-30 h-0 overflow-visible">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute block size-2 rounded-sm"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: `${p.delay}ms`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
