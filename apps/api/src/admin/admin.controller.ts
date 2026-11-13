import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseStatusDto } from './dto/update-exercise-status.dto';

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('feedback')
  listFeedback() {
    return this.admin.listFeedback();
  }

  @Get('exercises')
  listExercises() {
    return this.admin.listExercises();
  }

  @Post('exercises')
  createExercise(@Req() _request: AdminRequest, @Body() dto: CreateExerciseDto) {
    return this.admin.createExercise(dto);
  }

  @Patch('exercises/:id')
  updateExercise(@Param('id') id: string, @Body() dto: CreateExerciseDto) {
    return this.admin.updateExercise(id, dto);
  }

  @Patch('exercises/:id/status')
  updateExerciseStatus(@Param('id') id: string, @Body() dto: UpdateExerciseStatusDto) {
    return this.admin.updateExerciseStatus(id, dto);
  }
}
