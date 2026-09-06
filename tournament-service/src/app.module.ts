import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { StoreModule } from './store/store.module';
import { ValidationModule } from './modules/validation/validation.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { MatchmakingModule } from './modules/matchmaking/matchmaking.module';
import { SessionsModule } from './modules/sessions/sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    StoreModule,
    SessionsModule,
    ValidationModule,
    LeaderboardModule,
    MatchmakingModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
