import { Controller, ForbiddenException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { JwtAuthGuard, AuthedRequest } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('characters')
export class CharactersController {
  constructor(private readonly characters: CharactersService) {}

  @Post(':id/sync-unlocks')
  sync(@Param('id') id: string, @Req() req: AuthedRequest) {
    if (req.user?.playerId !== id) throw new ForbiddenException('Not your player');
    return this.characters.syncUnlocks(id);
  }
}
