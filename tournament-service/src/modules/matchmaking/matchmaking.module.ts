import { Module } from '@nestjs/common';
import { MatchmakingController } from './matchmaking.controller';

@Module({ controllers: [MatchmakingController] })
export class MatchmakingModule {}
