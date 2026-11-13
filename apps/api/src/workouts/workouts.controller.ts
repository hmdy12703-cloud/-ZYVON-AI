import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddWorkoutSetDto } from './dto/add-workout-set.dto';
import { ListWorkoutsDto } from './dto/list-workouts.dto';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { CompleteWorkoutDto } from './dto/complete-workout.dto';
import { WorkoutsService } from './workouts.service';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workouts: WorkoutsService) {}

  @Post()
  start(@Req() request: AuthRequest, @Body() dto: StartWorkoutDto) {
    return this.workouts.start(request.user.sub, dto);
  }

  @Get()
  list(@Req() request: AuthRequest, @Query() query: ListWorkoutsDto) {
    return this.workouts.list(request.user.sub, query);
  }

  @Get('progress')
  progress(@Req() request: AuthRequest) {
    return this.workouts.progress(request.user.sub);
  }

  @Get(':id')
  get(@Req() request: AuthRequest, @Param('id') id: string) {
    return this.workouts.get(request.user.sub, id);
  }

  @Post(':id/sets')
  addSet(@Req() request: AuthRequest, @Param('id') id: string, @Body() dto: AddWorkoutSetDto) {
    return this.workouts.addSet(request.user.sub, id, dto);
  }

  @Patch(':id/complete')
  complete(@Req() request: AuthRequest, @Param('id') id: string, @Body() dto: CompleteWorkoutDto) {
    return this.workouts.complete(request.user.sub, id, dto);
  }
}
