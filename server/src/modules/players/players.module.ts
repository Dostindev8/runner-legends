import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Player, PlayerSchema } from './schemas/player.schema';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Player.name, schema: PlayerSchema }]),
    AuthModule,
  ],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService, MongooseModule],
})
export class PlayersModule {}
