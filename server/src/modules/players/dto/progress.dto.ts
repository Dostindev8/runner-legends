import { IsInt, Max, Min } from 'class-validator';

/**
 * Progress submitted after a normal (non-tournament) run. The server still bounds it:
 * this is progression, not the competitive leaderboard (that goes through the
 * tournament-service anti-cheat). Hard caps stop trivially inflated single submissions.
 */
export class ProgressDto {
  @IsInt() @Min(0) @Max(5000)
  coinsEarned!: number;

  @IsInt() @Min(0) @Max(20000)
  xpEarned!: number;

  @IsInt() @Min(0) @Max(7)
  worldCompleted!: number; // 0 = none this run
}
