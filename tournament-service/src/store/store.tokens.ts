export const KV_STORE = Symbol('KV_STORE');
export const LEADERBOARD_STORE = Symbol('LEADERBOARD_STORE');

export interface IKvStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** Atomic increment with TTL applied on first write. Used for rate limiting. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  del(key: string): Promise<void>;
}

export interface LeaderboardEntry {
  playerId: string;
  score: number;
  replayId: string;
}

export interface ILeaderboardStore {
  submit(world: number, entry: LeaderboardEntry): Promise<void>;
  top(world: number, count: number): Promise<LeaderboardEntry[]>;
  /** Find a stored rival with score within +/- tolerancePct of target (GDD 4.3 matchmaking). */
  findRival(world: number, targetScore: number, tolerancePct: number): Promise<LeaderboardEntry | null>;
}
