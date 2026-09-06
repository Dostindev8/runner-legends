/**
 * Replay HMAC canonical payload (pure).
 * Purpose: bind difficultyId into the integrity hash so Legendary cannot be spoofed post-sign.
 * Dependencies: SubmitReplayDto field shape only
 * Date: 2026-08-10
 */
import type { SubmitReplayDto } from '../modules/validation/dto/submit-replay.dto';

export type ReplayHmacFields = Pick<
  SubmitReplayDto,
  | 'playerId'
  | 'characterId'
  | 'world'
  | 'level'
  | 'durationMs'
  | 'coinsCollected'
  | 'distanceMeters'
  | 'inputCount'
  | 'score'
  | 'configVersion'
  | 'difficultyId'
>;

/** Canonical string for replay HMAC — includes difficultyId (v3.0 anti-spoof). */
export function buildReplayHmacCanonical(dto: ReplayHmacFields): string {
  return [
    dto.playerId, dto.characterId, dto.world, dto.level, dto.durationMs,
    dto.coinsCollected, dto.distanceMeters, dto.inputCount, dto.score,
    dto.configVersion, dto.difficultyId,
  ].join('|');
}
