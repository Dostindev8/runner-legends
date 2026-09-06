import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { IKvStore, ILeaderboardStore, KV_STORE, LEADERBOARD_STORE } from '../../store/store.tokens';
import { buildReplayHmacCanonical } from '../../shared/replay-hmac';
import { SessionsService } from '../sessions/sessions.service';
import { validateReplay } from './replay-validator';
import { SubmitReplayDto } from './dto/submit-replay.dto';

export interface SubmitResult { accepted: boolean; replayId?: string; reason?: string }

@Injectable()
export class ValidationService {
  private readonly maxPerHour = Number(process.env.MAX_SUBMISSIONS_PER_HOUR ?? '20');
  private static readonly REPLAY_TTL = 7 * 24 * 60 * 60; // 7 days (GDD 4.3)

  constructor(
    private readonly sessions: SessionsService,
    @Inject(KV_STORE) private readonly kv: IKvStore,
    @Inject(LEADERBOARD_STORE) private readonly leaderboard: ILeaderboardStore,
  ) {}

  async submit(dto: SubmitReplayDto): Promise<SubmitResult> {
    // 1) Rate limit FIRST (GDD 3.5): explicit 429, never silent, before touching anything.
    const bucket = Math.floor(Date.now() / 3_600_000);
    const count = await this.kv.incr(`sub:${dto.playerId}:${bucket}`, 3_600);
    if (count > this.maxPerHour) {
      throw new HttpException('Score submission rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    // 2) One-shot session (prevents replay reuse) + ownership.
    const session = await this.sessions.consume(dto.sessionId);
    if (session.playerId !== dto.playerId) throw new UnauthorizedException('Session/player mismatch');

    // 3) HMAC integrity of the input stream signature (GDD 3.5).
    if (!this.verifyHmac(dto, session.key)) return { accepted: false, reason: 'bad-signature' };

    // 4) Physics recomputation (never trust client score).
    const result = validateReplay({
      characterId: dto.characterId, world: dto.world, level: dto.level,
      durationMs: dto.durationMs, coinsCollected: dto.coinsCollected,
      distanceMeters: dto.distanceMeters, inputCount: dto.inputCount,
      configVersion: dto.configVersion,
      difficultyId: dto.difficultyId,
      portalRoute: dto.portalRoute ?? [],
    });
    if (!result.valid) return { accepted: false, reason: result.reason };

    // 5) Persist metadata + write leaderboard (ONLY from here — never a public endpoint).
    const replayId = randomUUID();
    await this.kv.set(`replay:${replayId}`, JSON.stringify({
      playerId: dto.playerId, world: dto.world, level: dto.level, score: dto.score,
      difficultyId: dto.difficultyId, at: Date.now(),
    }), ValidationService.REPLAY_TTL);
    await this.leaderboard.submit(dto.world, { playerId: dto.playerId, score: dto.score, replayId });

    return { accepted: true, replayId };
  }

  private verifyHmac(dto: SubmitReplayDto, key: string): boolean {
    const expected = createHmac('sha256', key).update(buildReplayHmacCanonical(dto)).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(dto.hmac);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
