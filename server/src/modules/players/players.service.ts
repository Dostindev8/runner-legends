import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player } from './schemas/player.schema';
import { ProgressDto } from './dto/progress.dto';

@Injectable()
export class PlayersService {
  constructor(@InjectModel(Player.name) private readonly players: Model<Player>) {}

  async getProfile(playerId: string): Promise<Player> {
    const p = await this.players.findOne({ playerId }).lean();
    if (!p) throw new NotFoundException('Player not found');
    return p;
  }

  async applyProgress(playerId: string, dto: ProgressDto): Promise<Player> {
    const inc: Record<string, number> = { coins: dto.coinsEarned, accountXp: dto.xpEarned };

    const updated = await this.players.findOneAndUpdate(
      { playerId },
      {
        $inc: inc,
        // $max keeps the highest world reached without double-counting replays.
        ...(dto.worldCompleted > 0 ? { $max: { worldsCompleted: dto.worldCompleted } } : {}),
      },
      { new: true },
    ).lean();

    if (!updated) throw new NotFoundException('Player not found');
    // Simple level curve: 1 level per 1000 xp.
    const level = 1 + Math.floor(updated.accountXp / 1000);
    if (level !== updated.accountLevel) {
      await this.players.updateOne({ playerId }, { $set: { accountLevel: level } });
      updated.accountLevel = level;
    }
    return updated;
  }
}
