import { createHmac } from 'crypto';
import { validateReplay, ReplayFacts } from './replay-validator';
import { buildReplayHmacCanonical } from '../../shared/replay-hmac';
import { PHYSICS_CONFIG_VERSION, LEVEL_PORTALS } from '../../shared/physics-config';
import {
  COYOTE_TIME_FLOOR_MS,
  DIFFICULTY_PROFILES,
  assertCoyoteFloor,
} from '../../shared/difficulty';

const base: ReplayFacts = {
  characterId: 'kori_voltz',
  world: 1,
  level: 1,
  durationMs: 60_000,
  coinsCollected: 200,
  distanceMeters: 600,
  inputCount: 120,
  configVersion: PHYSICS_CONFIG_VERSION,
  difficultyId: 'normal',
  portalRoute: [],
};

describe('validateReplay (anti-cheat)', () => {
  it('accepts a legitimate run', () => {
    expect(validateReplay(base).valid).toBe(true);
  });

  it('rejects a config version mismatch', () => {
    expect(validateReplay({ ...base, configVersion: '9.9.9' }).reason).toBe('config-version-mismatch');
  });

  it('rejects impossibly fast times', () => {
    expect(validateReplay({ ...base, durationMs: 5_000 }).reason).toBe('impossible-time');
  });

  it('rejects superhuman speed', () => {
    // 600m in 10s = 60 u/s, far beyond any character cap.
    expect(validateReplay({ ...base, durationMs: 10_000, distanceMeters: 600 }).reason).toBe('impossible-time');
    expect(validateReplay({ ...base, durationMs: 25_000, distanceMeters: 900 }).reason).toBe('speed-exceeded');
  });

  it('rejects impossible coin counts', () => {
    expect(validateReplay({ ...base, coinsCollected: 100_000 }).reason).toBe('coins-impossible');
  });

  it('rejects input spam / scripting', () => {
    expect(validateReplay({ ...base, inputCount: 5_000 }).reason).toBe('input-spam');
  });

  it('rejects legendary spoof without a matching known difficultyId in hash facts', () => {
    // Fake / missing difficulty cannot claim legendary rewards via score facts.
    expect(validateReplay({ ...base, difficultyId: 'legendary_spoof' }).reason).toBe('unknown-difficulty');
    expect(validateReplay({ ...base, difficultyId: '' }).reason).toBe('unknown-difficulty');

    // HMAC canonical binds difficultyId — signing as normal then claiming legendary diverges.
    const fields = {
      playerId: 'player-aaaaaaaa',
      characterId: 'kori_voltz',
      world: 1,
      level: 1,
      durationMs: 60_000,
      coinsCollected: 200,
      distanceMeters: 600,
      inputCount: 120,
      score: 9001,
      configVersion: PHYSICS_CONFIG_VERSION,
      difficultyId: 'normal' as string,
    };
    const key = 'session-test-key';
    const normalMac = createHmac('sha256', key).update(buildReplayHmacCanonical(fields)).digest('hex');
    const legendaryClaim = { ...fields, difficultyId: 'legendary' };
    const legendaryMac = createHmac('sha256', key).update(buildReplayHmacCanonical(legendaryClaim)).digest('hex');
    expect(buildReplayHmacCanonical(fields)).not.toBe(buildReplayHmacCanonical(legendaryClaim));
    expect(normalMac).not.toBe(legendaryMac);
    // A client that played Normal cannot reuse that MAC while reporting Legendary.
    expect(normalMac).not.toEqual(
      createHmac('sha256', key).update(buildReplayHmacCanonical(legendaryClaim)).digest('hex'),
    );
  });

  it('rejects portal ghost ids not in LEVEL_PORTALS for the world:level', () => {
    const valid = LEVEL_PORTALS['1:1'][0];
    expect(validateReplay({ ...base, portalRoute: [valid] }).valid).toBe(true);
    expect(
      validateReplay({ ...base, portalRoute: ['portal_ghost_injected_by_cheat'] }).reason,
    ).toBe('portal-ghost');
  });

  it('documents coyote floor at 40ms across all difficulty profiles', () => {
    expect(COYOTE_TIME_FLOOR_MS).toBe(40);
    expect(DIFFICULTY_PROFILES.legendary.coyoteTimeMs).toBe(COYOTE_TIME_FLOOR_MS);
    expect(DIFFICULTY_PROFILES.legendary.jumpBufferMs).toBe(COYOTE_TIME_FLOOR_MS);
    expect(assertCoyoteFloor()).toBe(true);
    for (const profile of Object.values(DIFFICULTY_PROFILES)) {
      expect(profile.coyoteTimeMs).toBeGreaterThanOrEqual(COYOTE_TIME_FLOOR_MS);
      expect(profile.jumpBufferMs).toBeGreaterThanOrEqual(COYOTE_TIME_FLOOR_MS);
    }
  });
});
