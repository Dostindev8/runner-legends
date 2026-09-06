import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { IKvStore, KV_STORE } from '../../store/store.tokens';

export interface ReplaySession { playerId: string; key: string }

/**
 * Issues a per-run session key (GDD 3.5): the client signs its replay submission with an
 * HMAC of this key, so a captured valid replay can't be re-submitted or edited by others.
 */
@Injectable()
export class SessionsService {
  private static readonly TTL = 60 * 60; // 1h

  constructor(@Inject(KV_STORE) private readonly kv: IKvStore) {}

  async start(playerId: string): Promise<{ sessionId: string; key: string }> {
    const sessionId = randomUUID();
    const key = randomBytes(32).toString('hex');
    await this.kv.set(`sess:${sessionId}`, JSON.stringify({ playerId, key } as ReplaySession), SessionsService.TTL);
    return { sessionId, key };
  }

  async consume(sessionId: string): Promise<ReplaySession> {
    const raw = await this.kv.get(`sess:${sessionId}`);
    if (!raw) throw new UnauthorizedException('Invalid or expired session');
    await this.kv.del(`sess:${sessionId}`); // one-shot: prevents replay-reuse
    return JSON.parse(raw) as ReplaySession;
  }
}
