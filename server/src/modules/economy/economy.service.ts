import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player } from '../players/schemas/player.schema';
import { MAX_UPGRADE_LEVEL, nextLevelCost, UpgradeBranch } from '../../shared/upgrade-tables';

@Injectable()
export class EconomyService {
  constructor(@InjectModel(Player.name) private readonly players: Model<Player>) {}

  /** Buy the next level of a branch. Server-authoritative + race-safe (GDD 9.1). */
  async upgrade(playerId: string, branch: UpgradeBranch): Promise<Player> {
    const player = await this.players.findOne({ playerId }).lean();
    if (!player) throw new NotFoundException('Player not found');

    const level = player.upgrades[branch];
    if (level >= MAX_UPGRADE_LEVEL) throw new BadRequestException('Branch already maxed (no power creep)');

    const cost = nextLevelCost(branch, level);
    if (player.coins < cost) throw new BadRequestException('Insufficient coins');

    // Conditional update guarantees no double-spend under concurrent requests.
    const field = `upgrades.${branch}`;
    const updated = await this.players.findOneAndUpdate(
      { playerId, coins: { $gte: cost }, [field]: { $lt: MAX_UPGRADE_LEVEL } },
      { $inc: { coins: -cost, [field]: 1 } },
      { new: true },
    ).lean();

    if (!updated) throw new ConflictException('Upgrade race lost; retry');
    return updated;
  }
}
