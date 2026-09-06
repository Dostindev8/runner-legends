/**
 * Selectable difficulty profiles (mega prompt v3.0 §7.1).
 * Purpose: server-side source of truth for anti-cheat hash facts + fairness floors.
 * Dependencies: none (pure config)
 * Date: 2026-08-10
 *
 * Hard rule: NEVER reduce coyote / jump-buffer below COYOTE_TIME_FLOOR_MS (40ms) —
 * below that, mobile input becomes unplayable (GDD Fairness checklist).
 */

/** Absolute floor for coyote time AND jump buffering across all profiles (ms). */
export const COYOTE_TIME_FLOOR_MS = 40;

export type DifficultyId = 'normal' | 'hard' | 'expert' | 'legendary';

export interface DifficultyProfile {
  id: DifficultyId;
  /** Scroll / world speed multiplier vs GDD base (1.0 = 100%). */
  scrollSpeedMult: number;
  coyoteTimeMs: number;
  jumpBufferMs: number;
  /** Obstacle density multiplier (1.0 = design baseline). */
  obstacleDensityMult: number;
  /** Enemy attack-speed multiplier. */
  enemyAttackSpeedMult: number;
  /** Coin / reward multiplier. */
  rewardMult: number;
}

/**
 * Profiles Normal / Hard / Expert / Legendary.
 * Values mirror mega prompt table 7.1; coyote/buffer clamped ≥ COYOTE_TIME_FLOOR_MS.
 */
export const DIFFICULTY_PROFILES: Record<DifficultyId, DifficultyProfile> = {
  normal: {
    id: 'normal',
    scrollSpeedMult: 1.0,
    coyoteTimeMs: 100,
    jumpBufferMs: 100,
    obstacleDensityMult: 1.0,
    enemyAttackSpeedMult: 1.0,
    rewardMult: 1.0,
  },
  hard: {
    id: 'hard',
    scrollSpeedMult: 1.15,
    coyoteTimeMs: 80,
    jumpBufferMs: 80,
    obstacleDensityMult: 1.2,
    enemyAttackSpeedMult: 1.15,
    rewardMult: 1.25,
  },
  expert: {
    id: 'expert',
    scrollSpeedMult: 1.3,
    coyoteTimeMs: 60,
    jumpBufferMs: 60,
    obstacleDensityMult: 1.35,
    enemyAttackSpeedMult: 1.3,
    rewardMult: 1.5,
  },
  legendary: {
    id: 'legendary',
    scrollSpeedMult: 1.45,
    // Floor documented: legendary uses the minimum legal coyote/buffer (40ms).
    coyoteTimeMs: COYOTE_TIME_FLOOR_MS,
    jumpBufferMs: COYOTE_TIME_FLOOR_MS,
    obstacleDensityMult: 1.5,
    enemyAttackSpeedMult: 1.5,
    rewardMult: 2.0,
  },
};

export function isDifficultyId(value: string): value is DifficultyId {
  return Object.prototype.hasOwnProperty.call(DIFFICULTY_PROFILES, value);
}

export function getDifficultyProfile(id: string): DifficultyProfile | undefined {
  return isDifficultyId(id) ? DIFFICULTY_PROFILES[id] : undefined;
}

/** Assert every profile respects the coyote/buffer floor (used by unit tests). */
export function assertCoyoteFloor(profiles: Record<string, DifficultyProfile> = DIFFICULTY_PROFILES): boolean {
  return Object.values(profiles).every(
    (p) => p.coyoteTimeMs >= COYOTE_TIME_FLOOR_MS && p.jumpBufferMs >= COYOTE_TIME_FLOOR_MS,
  );
}
