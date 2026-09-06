import type Redis from 'ioredis';
import { IKvStore, ILeaderboardStore, LeaderboardEntry } from './store.tokens';

export class RedisKvStore implements IKvStore {
  constructor(private readonly redis: Redis) {}
  async get(key: string): Promise<string | null> { return this.redis.get(key); }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) await this.redis.set(key, value, 'EX', ttlSeconds);
    else await this.redis.set(key, value);
  }
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const n = await this.redis.incr(key);
    if (n === 1) await this.redis.expire(key, ttlSeconds);
    return n;
  }
  async del(key: string): Promise<void> { await this.redis.del(key); }
}

/** Leaderboard as Redis sorted sets (GDD 4.1/4.3). Replay id stored in a side hash. */
export class RedisLeaderboardStore implements ILeaderboardStore {
  constructor(private readonly redis: Redis) {}
  private zkey(world: number) { return `lb:${world}`; }
  private hkey(world: number) { return `lb:${world}:replay`; }

  async submit(world: number, entry: LeaderboardEntry): Promise<void> {
    // GT keeps only the player's best score.
    await this.redis.zadd(this.zkey(world), 'GT', String(entry.score), entry.playerId);
    await this.redis.hset(this.hkey(world), entry.playerId, entry.replayId);
  }

  async top(world: number, count: number): Promise<LeaderboardEntry[]> {
    const raw = await this.redis.zrevrange(this.zkey(world), 0, count - 1, 'WITHSCORES');
    const out: LeaderboardEntry[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const playerId = raw[i];
      const replayId = (await this.redis.hget(this.hkey(world), playerId)) ?? '';
      out.push({ playerId, score: Number(raw[i + 1]), replayId });
    }
    return out;
  }

  async findRival(world: number, targetScore: number, tolerancePct: number): Promise<LeaderboardEntry | null> {
    const tol = targetScore * tolerancePct;
    const min = Math.max(0, targetScore - tol);
    const max = targetScore + tol;
    const ids = await this.redis.zrangebyscore(this.zkey(world), min, max, 'LIMIT', 0, 50);
    if (!ids.length) return null;
    const playerId = ids[Math.floor(Math.random() * ids.length)];
    const score = Number(await this.redis.zscore(this.zkey(world), playerId));
    const replayId = (await this.redis.hget(this.hkey(world), playerId)) ?? '';
    return { playerId, score, replayId };
  }
}
