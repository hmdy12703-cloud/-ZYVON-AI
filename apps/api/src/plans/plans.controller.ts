import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlansService } from './plans.service';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  list(@Req() request: AuthRequest) {
    return this.plans.list(request.user.sub);
  }

  @Post('generate')
  generate(@Req() request: AuthRequest) {
    return this.plans.generate(request.user.sub);
  }

  @Get('progression/recommendations')
  progressionRecommendations(@Req() request: AuthRequest) {
    return this.plans.progressionRecommendations(request.user.sub);
  }

  @Get(':id')
  get(@Req() request: AuthRequest, @Param('id') id: string) {
    return this.plans.get(request.user.sub, id);
  }

  @Post(':id/activate')
  activate(@Req() request: AuthRequest, @Param('id') id: string) {
    return this.plans.activate(request.user.sub, id);
  }
}
