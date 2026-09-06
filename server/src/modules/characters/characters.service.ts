import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player } from '../players/schemas/player.schema';

/** World-completion thresholds that unlock each character (GDD 9.2). */
const UNLOCK_BY_WORLD: ReadonlyArray<{ world: number; id: string }> = [
  { world: 0, id: 'kori_voltz' },
  { world: 1, id: 'shino_kage' },
  { world: 2, id: 'mc_rumor' },
  { world: 3, id: 'leo_dorado' },
  { world: 4, id: 'don_cash' },
  { world: 5, id: 'neon_groove' },
];

@Injectable()
export class CharactersService {
  constructor(@InjectModel(Player.name) private readonly players: Model<Player>) {}

  /** Recompute unlocks from progression (never sold for power — GDD 9.1). */
  async syncUnlocks(playerId: string): Promise<string[]> {
    const player = await this.players.findOne({ playerId }).lean();
    if (!player) throw new NotFoundException('Player not found');

    const earned = UNLOCK_BY_WORLD.filter((u) => player.worldsCompleted >= u.world).map((u) => u.id);
    await this.players.updateOne({ playerId }, { $addToSet: { unlockedCharacters: { $each: earned } } });
    return earned;
  }
}
