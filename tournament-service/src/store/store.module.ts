import { Global, Logger, Module } from '@nestjs/common';
import IORedis from 'ioredis';
import { KV_STORE, LEADERBOARD_STORE } from './store.tokens';
import { MemoryKvStore, MemoryLeaderboardStore } from './memory.store';
import { RedisKvStore, RedisLeaderboardStore } from './redis.store';

const logger = new Logger('StoreModule');

/**
 * Provides KV + leaderboard stores. Uses Redis when REDIS_URL is set, otherwise an
 * in-memory fallback (infra rule: "Redis with fallback to Map()"). A single shared
 * ioredis connection is reused by both stores.
 */
@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const url = process.env.REDIS_URL;
        if (!url) { logger.warn('REDIS_URL not set — using in-memory stores (dev only).'); return null; }
        return new IORedis(url, { maxRetriesPerRequest: 3, lazyConnect: false });
      },
    },
    {
      provide: KV_STORE,
      inject: ['REDIS_CLIENT'],
      useFactory: (redis: IORedis | null) => (redis ? new RedisKvStore(redis) : new MemoryKvStore()),
    },
    {
      provide: LEADERBOARD_STORE,
      inject: ['REDIS_CLIENT'],
      useFactory: (redis: IORedis | null) => (redis ? new RedisLeaderboardStore(redis) : new MemoryLeaderboardStore()),
    },
  ],
  exports: [KV_STORE, LEADERBOARD_STORE, 'REDIS_CLIENT'],
})
export class StoreModule {}
