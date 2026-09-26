/**
 * Feature flags + quality presets + physics parity with js/game.js CFG/DIFF.
 * Coyote is NOT a fixed 100ms — mirrors DIFF table exactly.
 */

export type QualityId = 'low' | 'mid' | 'high';
export type DiffId = 'normal' | 'hard' | 'expert' | 'legendary';

export const PHYSICS = {
  gravity: 2200,
  jumpVel: -900,
  jumpCut: 0.45,
  doubleJumpVel: -790,
  buffer: 0.15,
  maxFall: 1800,
  apexScale: 0.62,
  apexThreshold: 140,
  runStart: 340,
  runMax: 580,
  runAccel: 8,
  playerW: 0.72,
  playerH: 0.98,
  stageKills: 8,
  stageDist: 250,
  bossAt: 130,
  portalAt: 220,
  iframes: 1.1,
  maxHP: 3,
  /** World units: 1 unit ≈ 100 px of 2D logical height */
  scale: 0.01,
} as const;

export const DIFF: Record<
  DiffId,
  { id: DiffId; label: string; scroll: number; coyote: number; buffer: number; density: number; reward: number; chip: string }
> = {
  normal: { id: 'normal', label: 'Normal', scroll: 1.0, coyote: 0.12, buffer: 0.15, density: 1.0, reward: 1.0, chip: 'NORMAL' },
  hard: { id: 'hard', label: 'Difícil', scroll: 1.15, coyote: 0.11, buffer: 0.13, density: 1.15, reward: 1.25, chip: 'DIFÍCIL' },
  expert: { id: 'expert', label: 'Experto', scroll: 1.3, coyote: 0.1, buffer: 0.12, density: 1.28, reward: 1.5, chip: 'EXPERTO' },
  legendary: { id: 'legendary', label: 'Legendario', scroll: 1.45, coyote: 0.09, buffer: 0.12, density: 1.38, reward: 2.0, chip: 'LEGENDARIO' },
};

export interface QualityPreset {
  id: QualityId;
  dprMax: number;
  shadows: boolean;
  shadowMap: number;
  particles: number;
  bloom: boolean;
  fogDensity: number;
}

export const QUALITY: Record<QualityId, QualityPreset> = {
  low: { id: 'low', dprMax: 1.25, shadows: false, shadowMap: 512, particles: 0.35, bloom: false, fogDensity: 0.012 },
  mid: { id: 'mid', dprMax: 1.5, shadows: true, shadowMap: 1024, particles: 0.7, bloom: true, fogDensity: 0.018 },
  high: { id: 'high', dprMax: 2.0, shadows: true, shadowMap: 2048, particles: 1, bloom: true, fogDensity: 0.022 },
};

export function detectQuality(): QualityId {
  if (typeof navigator === 'undefined') return 'mid';
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  if (mobile || mem <= 2 || cores <= 4) return 'low';
  if (mem >= 8 && cores >= 8) return 'high';
  return 'mid';
}

export const FLAGS = {
  webgpu: true,
  reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  instancing: true,
} as const;
