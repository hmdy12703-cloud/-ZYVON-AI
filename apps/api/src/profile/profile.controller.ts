import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/current-user';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('users/me/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get()
  getProfile(@Req() request: AuthRequest) {
    return this.profiles.getForUser(request.user.sub);
  }

  @Patch()
  updateProfile(@Req() request: AuthRequest, @Body() dto: UpdateProfileDto) {
    return this.profiles.updateForUser(request.user.sub, request.user.email, dto);
  }
}
