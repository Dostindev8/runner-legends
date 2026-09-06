import { IKvStore, ILeaderboardStore, LeaderboardEntry } from './store.tokens';

/** Dev-only fallback (no Redis). Not for production scale. */
export class MemoryKvStore implements IKvStore {
  private readonly map = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const e = this.map.get(key);
    if (!e) return null;
    if (e.expiresAt && e.expiresAt < Date.now()) { this.map.delete(key); return null; }
    return e.value;
  }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.map.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
  }
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const cur = Number((await this.get(key)) ?? '0') + 1;
    await this.set(key, String(cur), ttlSeconds);
    return cur;
  }
  async del(key: string): Promise<void> { this.map.delete(key); }
}

export class MemoryLeaderboardStore implements ILeaderboardStore {
  private readonly boards = new Map<number, LeaderboardEntry[]>();

  async submit(world: number, entry: LeaderboardEntry): Promise<void> {
    const list = this.boards.get(world) ?? [];
    const existing = list.find((e) => e.playerId === entry.playerId);
    if (existing) { if (entry.score > existing.score) { existing.score = entry.score; existing.replayId = entry.replayId; } }
    else list.push({ ...entry });
    list.sort((a, b) => b.score - a.score);
    this.boards.set(world, list);
  }
  async top(world: number, count: number): Promise<LeaderboardEntry[]> {
    return (this.boards.get(world) ?? []).slice(0, count);
  }
  async findRival(world: number, targetScore: number, tolerancePct: number): Promise<LeaderboardEntry | null> {
    const list = this.boards.get(world) ?? [];
    const tol = targetScore * tolerancePct;
    const inBand = list.filter((e) => Math.abs(e.score - targetScore) <= tol);
    return inBand.length ? inBand[Math.floor(Math.random() * inBand.length)] : null;
  }
}
