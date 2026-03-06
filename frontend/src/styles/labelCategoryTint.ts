import type { CSSProperties } from 'react';
import type { Label } from '@/types/entities';

const CATEGORY_TO_HEX: Record<string, string> = {
  'Structure & Dynamics': '#4B7DBE',
  'Sound & Texture': '#7C5CFF',
  'Quality & Character': '#D6A84B',
  'Emotion & Mood': '#E06AA3',
  'Energy & Intensity': '#E05252',
  'Instruments & Sonic Drivers': '#2FB7A6',
  'Genre & Style': '#5A67D8',
  'Movement & Rhythm': '#7DBA4B',
  'Vocal & Lyrical': '#5BC0EB',
  'Listener Experience': '#57D6C4',
  Parts: '#8A93A6',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) return null;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

function rgbaFromHex(hex: string, alpha: number): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function getLabelCategory(label: Label | null | undefined): string | null {
  const meta = label?.metadata;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  const raw = (meta as Record<string, unknown>).category;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : null;
}

export function getLabelTintStyle(label: Label | null | undefined): CSSProperties | undefined {
  const category = getLabelCategory(label);
  if (!category) return undefined;

  const hex = CATEGORY_TO_HEX[category];
  if (!hex) return undefined;

  // Extremely faint on dark UI (organizational only)
  const tint = rgbaFromHex(hex, 0.08);
  if (!tint) return undefined;

  return {
    backgroundImage: `linear-gradient(${tint}, ${tint})`,
  };
}
