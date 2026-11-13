import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedUser } from './current-user';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('users')
@UseGuards(JwtAuthGuard)
export class MeController {
  @Get('me')
  async me(@Req() request: AuthRequest) {
    return { user: request.user };
  }
}
