import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post()
  create(@Req() request: AuthRequest, @Body() dto: CreateFeedbackDto) {
    return this.feedback.create(request.user.sub, dto);
  }

  @Get('mine')
  listMine(@Req() request: AuthRequest) {
    return this.feedback.listMine(request.user.sub);
  }
}
