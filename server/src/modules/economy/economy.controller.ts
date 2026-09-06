import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { UpgradeDto } from './dto/upgrade.dto';
import { JwtAuthGuard, AuthedRequest } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('economy')
export class EconomyController {
  constructor(private readonly economy: EconomyService) {}

  @Post('upgrade')
  upgrade(@Body() dto: UpgradeDto, @Req() req: AuthedRequest) {
    return this.economy.upgrade(req.user!.playerId, dto.branch);
  }
}
