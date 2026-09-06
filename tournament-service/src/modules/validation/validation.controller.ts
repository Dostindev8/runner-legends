import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ValidationService } from './validation.service';
import { SubmitReplayDto } from './dto/submit-replay.dto';

@Controller('replays')
export class ValidationController {
  constructor(private readonly validation: ValidationService) {}

  // Coarse network throttle; the per-player/hour business limit lives in the service.
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post('submit')
  submit(@Body() dto: SubmitReplayDto) {
    return this.validation.submit(dto);
  }
}
