import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PlayersService } from './players.service';
import { ProgressDto } from './dto/progress.dto';
import { JwtAuthGuard, AuthedRequest } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('players')
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Get(':id')
  getProfile(@Param('id') id: string, @Req() req: AuthedRequest) {
    this.assertOwner(id, req);
    return this.players.getProfile(id);
  }

  @Post(':id/progress')
  applyProgress(@Param('id') id: string, @Body() dto: ProgressDto, @Req() req: AuthedRequest) {
    this.assertOwner(id, req);
    return this.players.applyProgress(id, dto);
  }

  private assertOwner(id: string, req: AuthedRequest): void {
    if (req.user?.playerId !== id) throw new ForbiddenException('Not your player');
  }
}
