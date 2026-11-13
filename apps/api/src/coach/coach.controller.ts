import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoachMessageDto } from './dto/coach-message.dto';
import { CoachService } from './coach.service';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('coach')
@UseGuards(JwtAuthGuard)
export class CoachController {
  constructor(private readonly coach: CoachService) {}

  @Post('chat')
  ask(@Req() request: AuthRequest, @Body() dto: CoachMessageDto) {
    return this.coach.ask(request.user.sub, dto);
  }
}
