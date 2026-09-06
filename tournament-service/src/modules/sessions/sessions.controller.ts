import { Body, Controller, Post } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { SessionsService } from './sessions.service';

class StartSessionDto {
  @IsString() @MinLength(8) @MaxLength(64)
  playerId!: string;
}

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  // In production this endpoint is itself behind the progression JWT; the player id comes
  // from the verified token, not the body. Kept simple here for the service boundary.
  @Post('start')
  start(@Body() dto: StartSessionDto) {
    return this.sessions.start(dto.playerId);
  }
}
