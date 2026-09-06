/**
 * Versioned physics constants shared (in spirit) with the Unity client. The client sends
 * its configVersion with every replay; a mismatch is rejected so a silent balance change
 * can never desync validation (prompt §6). Bump the version whenever any constant changes.
 *
 * EXTEND (v3.0): difficulty profiles live in `./difficulty.ts` (coyote floor 40ms).
 * Portal waypoint ids for anti-cheat ghost rejection: LEVEL_PORTALS below.
 */
export const PHYSICS_CONFIG_VERSION = '1.0.0';

export interface CharacterPhysics { baseMaxSpeed: number } // world units / second

export const CHARACTER_PHYSICS: Record<string, CharacterPhysics> = {
  kori_voltz: { baseMaxSpeed: 11 },
  shino_kage: { baseMaxSpeed: 14 },
  mc_rumor: { baseMaxSpeed: 11 },
  leo_dorado: { baseMaxSpeed: 12.5 },
  don_cash: { baseMaxSpeed: 9.5 },
  neon_groove: { baseMaxSpeed: 14 },
};

export const SPEED_UPGRADE_MAX_MULT = 1.25; // GDD 8.3: +25% at max
export const SUPER_MOBILITY_MAX_MULT = 1.5; // GDD 8.2: extreme mobility +50% cap
export const SPEED_MARGIN = 1.05;           // GDD 3.5: 5% tolerance
export const COIN_MARGIN = 1.05;            // GDD 3.5: 5% overlap tolerance
export const MAX_INPUTS_PER_SECOND = 20;    // human tap ceiling (script-farming guard)

export function absoluteMaxSpeed(characterId: string): number {
  const base = CHARACTER_PHYSICS[characterId]?.baseMaxSpeed ?? 12;
  return base * SPEED_UPGRADE_MAX_MULT * SUPER_MOBILITY_MAX_MULT * SPEED_MARGIN;
}

export interface LevelBounds { minTimeMs: number; maxCoins: number; lengthMeters: number }

// Precomputed offline per designed level from the optimal route (GDD 4.3), shipped with
// the config. Placeholder defaults until the level-analysis tool populates real values.
const LEVEL_BOUNDS: Record<string, LevelBounds> = {
  '1:1': { minTimeMs: 22_000, maxCoins: 320, lengthMeters: 850 },
};

export function levelBounds(world: number, level: number): LevelBounds {
  return LEVEL_BOUNDS[`${world}:${level}`] ?? { minTimeMs: 20_000, maxCoins: 400, lengthMeters: 900 };
}

/**
 * Valid portal waypoint ids per `world:level` (mega prompt §5.3).
 * Replays listing any id outside this set are rejected as portal ghosts.
 * Placeholder seeds for world 1 until the level editor exports real graphs.
 */
export const LEVEL_PORTALS: Record<string, readonly string[]> = {
  '1:1': ['portal_w1l1_a_in', 'portal_w1l1_a_out', 'portal_w1l1_b_in', 'portal_w1l1_b_out'],
};

export function levelPortalIds(world: number, level: number): ReadonlySet<string> {
  const list = LEVEL_PORTALS[`${world}:${level}`] ?? [];
  return new Set(list);
}
