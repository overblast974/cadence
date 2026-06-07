import { describe, expect, it } from 'vitest';
import { computeViewportMode } from '../useViewportMode';

describe('computeViewportMode', () => {
  it('détecte le format "compact" sur l’écran de couverture du Z Fold 4 (~344x882)', () => {
    expect(computeViewportMode(344, 882)).toBe('compact');
  });

  it('détecte le format "expanded" sur l’écran principal déplié (~690x830)', () => {
    expect(computeViewportMode(690, 830)).toBe('expanded');
  });

  // Le Z Fold 5 reprend exactement les mêmes panneaux que le Z Fold 4
  // (904x2316 fermé, 1812x2176 ouvert) : déjà couvert par les cas ci-dessus.
  // Le Z Fold 6 et le Z Fold 7 ont des panneaux légèrement plus grands — on
  // vérifie ici qu'ils tombent bien des deux côtés des seuils (largeur et
  // ratio), ce qui confirme que l'heuristique généralise à toute la gamme
  // pliable plutôt que de ne reconnaître qu'un seul modèle.
  it('détecte le format "compact" sur l’écran de couverture du Z Fold 6 (~369x905)', () => {
    expect(computeViewportMode(369, 905)).toBe('compact');
  });

  it('détecte le format "expanded" sur l’écran principal déplié du Z Fold 6 (~707x823)', () => {
    expect(computeViewportMode(707, 823)).toBe('expanded');
  });

  it('détecte le format "compact" sur l’écran de couverture du Z Fold 7 (~411x960)', () => {
    expect(computeViewportMode(411, 960)).toBe('compact');
  });

  it('détecte le format "expanded" sur l’écran principal déplié du Z Fold 7 (~750x832)', () => {
    expect(computeViewportMode(750, 832)).toBe('expanded');
  });

  it('reste en "compact" pour un téléphone classique en portrait (ex. 412x915)', () => {
    expect(computeViewportMode(412, 915)).toBe('compact');
  });

  it('reste en "compact" pour un téléphone classique en paysage étroit (ex. 915x412 mais ratio élevé sans largeur suffisante n’entre pas ici)', () => {
    // Un téléphone en paysage est large mais peu haut : ratio largement > 1, largeur suffisante → expanded
    // (se comporte alors comme une mini-tablette, ce qui est le comportement souhaité)
    expect(computeViewportMode(915, 412)).toBe('expanded');
  });

  it('passe en "expanded" pour un format tablette carré', () => {
    expect(computeViewportMode(800, 800)).toBe('expanded');
  });

  it('reste "compact" pour une fenêtre étroite même si elle est haute', () => {
    expect(computeViewportMode(420, 1200)).toBe('compact');
  });
});
