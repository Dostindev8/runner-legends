import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SubmitReplayDto {
  @IsString() @MinLength(8) @MaxLength(64) sessionId!: string;
  @IsString() @MinLength(8) @MaxLength(64) playerId!: string;
  @IsString() @MaxLength(40) characterId!: string;

  @IsInt() @Min(1) @Max(7) world!: number;
  @IsInt() @Min(1) @Max(10) level!: number;

  @IsInt() @Min(0) @Max(3_600_000) durationMs!: number;
  @IsInt() @Min(0) @Max(100_000) coinsCollected!: number;
  @IsNumber() @Min(0) @Max(100_000) distanceMeters!: number;
  @IsInt() @Min(0) @Max(1_000_000) inputCount!: number;
  @IsInt() @Min(0) score!: number;

  /** Required difficulty profile id (normal|hard|expert|legendary) — bound into HMAC. */
  @IsString() @MinLength(3) @MaxLength(32) difficultyId!: string;

  /** Optional ordered portal waypoint ids (max 20); unknown ids rejected as ghosts. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  portalRoute?: string[];

  @IsString() @MaxLength(16) configVersion!: string;
  @IsString() @MinLength(32) @MaxLength(128) hmac!: string;
}
