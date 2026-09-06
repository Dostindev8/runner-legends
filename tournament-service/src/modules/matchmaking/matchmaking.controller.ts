import { Controller, Get, Inject, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ILeaderboardStore, LEADERBOARD_STORE } from '../../store/store.tokens';

@Controller('matchmaking')
export class MatchmakingController {
  // GDD 4.3: rival within +/-15% of the player's score, same world.
  private static readonly TOLERANCE = 0.15;

  constructor(@Inject(LEADERBOARD_STORE) private readonly store: ILeaderboardStore) {}

  @Get(':world')
  async findRival(
    @Param('world', ParseIntPipe) world: number,
    @Query('score', ParseIntPipe) score: number,
  ) {
    const rival = await this.store.findRival(world, score, MatchmakingController.TOLERANCE);
    if (!rival) throw new NotFoundException('No rival in range; try again or widen band');
    return rival;
  }
}
