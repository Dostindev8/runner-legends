import { Module } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { EconomyController } from './economy.controller';
import { PlayersModule } from '../players/players.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PlayersModule, AuthModule],
  controllers: [EconomyController],
  providers: [EconomyService],
})
export class EconomyModule {}
