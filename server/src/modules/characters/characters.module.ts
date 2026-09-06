import { Module } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { PlayersModule } from '../players/players.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PlayersModule, AuthModule],
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {}
