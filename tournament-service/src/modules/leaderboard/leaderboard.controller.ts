import { Controller, DefaultValuePipe, Get, Inject, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ILeaderboardStore, LEADERBOARD_STORE } from '../../store/store.tokens';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(@Inject(LEADERBOARD_STORE) private readonly store: ILeaderboardStore) {}

  @Get(':world')
  top(
    @Param('world', ParseIntPipe) world: number,
    @Query('count', new DefaultValuePipe(50), ParseIntPipe) count: number,
  ) {
    return this.store.top(world, Math.min(Math.max(count, 1), 200));
  }
}
