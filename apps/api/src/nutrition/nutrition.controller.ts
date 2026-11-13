import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateNutritionLogDto } from './dto/create-nutrition-log.dto';
import { NutritionService } from './nutrition.service';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('nutrition')
@UseGuards(JwtAuthGuard)
export class NutritionController {
  constructor(private readonly nutrition: NutritionService) {}

  @Get('logs')
  list(@Req() request: AuthRequest) {
    return this.nutrition.list(request.user.sub);
  }

  @Post('logs')
  create(@Req() request: AuthRequest, @Body() dto: CreateNutritionLogDto) {
    return this.nutrition.create(request.user.sub, dto);
  }
}
