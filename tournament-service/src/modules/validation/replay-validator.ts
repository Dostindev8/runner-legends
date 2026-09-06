import {
  PHYSICS_CONFIG_VERSION,
  absoluteMaxSpeed,
  levelBounds,
  levelPortalIds,
  COIN_MARGIN,
  MAX_INPUTS_PER_SECOND,
} from '../../shared/physics-config';
import { getDifficultyProfile } from '../../shared/difficulty';

export interface ReplayFacts {
  characterId: string;
  world: number;
  level: number;
  durationMs: number;
  coinsCollected: number;
  distanceMeters: number;
  inputCount: number;
  configVersion: string;
  /** Required (v3.0): must match a known DIFFICULTY_PROFILES id and the HMAC facts. */
  difficultyId: string;
  /** Ordered portal waypoint ids traversed this run (ghost ids rejected vs LEVEL_PORTALS). */
  portalRoute: string[];
}

export type RejectReason =
  | 'config-version-mismatch'
  | 'impossible-time'
  | 'speed-exceeded'
  | 'coins-impossible'
  | 'distance-impossible'
  | 'input-spam'
  | 'unknown-difficulty'
  | 'portal-ghost';

export interface ValidationResult { valid: boolean; reason?: RejectReason }

/**
 * Pure, deterministic anti-cheat recomputation (GDD 3.5 / prompt §6). No I/O — unit-tested.
 * Server never trusts the client's "final score"; it re-derives feasibility from the facts.
 * EXTEND v3.0: difficultyId + portalRoute (reject unknown portals / spoofed legendary).
 */
export function validateReplay(f: ReplayFacts): ValidationResult {
  if (f.configVersion !== PHYSICS_CONFIG_VERSION) return { valid: false, reason: 'config-version-mismatch' };

  // Difficulty must be a known profile — blocks "legendary" reward spoof with a fake id,
  // and forces the id into hash facts (HMAC also binds difficultyId separately).
  if (!getDifficultyProfile(f.difficultyId)) return { valid: false, reason: 'unknown-difficulty' };

  const allowedPortals = levelPortalIds(f.world, f.level);
  for (const portalId of f.portalRoute ?? []) {
    if (!allowedPortals.has(portalId)) return { valid: false, reason: 'portal-ghost' };
  }

  const bounds = levelBounds(f.world, f.level);
  const seconds = f.durationMs / 1000;
  if (seconds <= 0 || f.durationMs < bounds.minTimeMs) return { valid: false, reason: 'impossible-time' };

  const impliedSpeed = f.distanceMeters / seconds;
  if (impliedSpeed > absoluteMaxSpeed(f.characterId)) return { valid: false, reason: 'speed-exceeded' };

  if (f.distanceMeters > bounds.lengthMeters * 1.1) return { valid: false, reason: 'distance-impossible' };
  if (f.coinsCollected > bounds.maxCoins * COIN_MARGIN) return { valid: false, reason: 'coins-impossible' };

  if (f.inputCount / seconds > MAX_INPUTS_PER_SECOND) return { valid: false, reason: 'input-spam' };

  return { valid: true };
}
