import {
  Briefcase,
  Dumbbell,
  Home,
  Sparkles,
  BookOpen,
  Heart,
  Coffee,
  Music,
  Palette,
  ShoppingBag,
  Plane,
  Sun,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Dumbbell,
  Briefcase,
  Home,
  BookOpen,
  Heart,
  Coffee,
  Music,
  Palette,
  ShoppingBag,
  Plane,
  Sun,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export function iconForName(name?: string): LucideIcon {
  if (name && CATEGORY_ICONS[name]) return CATEGORY_ICONS[name];
  return Sparkles;
}

export interface ColorStyle {
  /** Texte (ex : titre de catégorie) */
  text: string;
  /** Fond doux pour badges / puces */
  soft: string;
  /** Couleur "pleine" pour les ronds, anneaux de progression, etc. */
  solid: string;
  /** Halo / glow utilisé sur les éléments actifs */
  ring: string;
}

export const COLOR_TOKENS = ['violet', 'coral', 'amber', 'mint'] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

export const COLOR_STYLES: Record<ColorToken, ColorStyle> = {
  violet: {
    text: 'text-accent-violet-soft',
    soft: 'bg-accent-violet/15 text-accent-violet-soft',
    solid: 'bg-accent-violet',
    ring: 'shadow-[0_0_0_3px_rgba(139,92,246,0.25)]',
  },
  coral: {
    text: 'text-accent-coral',
    soft: 'bg-accent-coral/15 text-accent-coral',
    solid: 'bg-accent-coral',
    ring: 'shadow-[0_0_0_3px_rgba(249,115,115,0.25)]',
  },
  amber: {
    text: 'text-accent-amber',
    soft: 'bg-accent-amber/15 text-accent-amber',
    solid: 'bg-accent-amber',
    ring: 'shadow-[0_0_0_3px_rgba(251,191,102,0.25)]',
  },
  mint: {
    text: 'text-accent-mint',
    soft: 'bg-accent-mint/15 text-accent-mint',
    solid: 'bg-accent-mint',
    ring: 'shadow-[0_0_0_3px_rgba(94,234,212,0.25)]',
  },
};

export function colorStyle(token?: string): ColorStyle {
  if (token && token in COLOR_STYLES) return COLOR_STYLES[token as ColorToken];
  return COLOR_STYLES.violet;
}
