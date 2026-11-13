import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExerciseStatus, WorkoutStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddWorkoutSetDto } from './dto/add-workout-set.dto';
import { ListWorkoutsDto } from './dto/list-workouts.dto';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { CompleteWorkoutDto } from './dto/complete-workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(userId: string, dto: StartWorkoutDto) {
    if (dto.trainingPlanId) {
      const plan = await this.prisma.trainingPlan.findFirst({
        where: { id: dto.trainingPlanId, userId },
        select: { id: true },
      });
      if (!plan) throw new NotFoundException('Training plan not found');
    }
    return this.prisma.workoutSession.create({
      data: {
        userId,
        ...(dto.trainingPlanId ? { trainingPlanId: dto.trainingPlanId } : {}),
      },
      select: { id: true, trainingPlanId: true, startedAt: true, status: true },
    });
  }

  async list(userId: string, query: ListWorkoutsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { userId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.workoutSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          trainingPlanId: true,
          startedAt: true,
          completedAt: true,
          status: true,
          perceivedEffort: true,
          feedback: true,
          _count: { select: { sets: true } },
        },
      }),
      this.prisma.workoutSession.count({ where }),
    ]);
    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async get(userId: string, workoutId: string) {
    const workout = await this.prisma.workoutSession.findFirst({
      where: { id: workoutId, userId },
      include: {
        sets: {
          orderBy: [{ setNumber: 'asc' }, { id: 'asc' }],
          include: {
            exercise: { select: { slug: true, nameAr: true, nameEn: true } },
          },
        },
      },
    });
    if (!workout) throw new NotFoundException('Workout not found');
    return workout;
  }

  async addSet(userId: string, workoutId: string, dto: AddWorkoutSetDto) {
    if (dto.reps === undefined && dto.durationSeconds === undefined) {
      throw new BadRequestException('Provide reps or durationSeconds');
    }
    const workout = await this.prisma.workoutSession.findFirst({
      where: { id: workoutId, userId, status: WorkoutStatus.IN_PROGRESS },
      select: { id: true },
    });
    if (!workout) throw new NotFoundException('Active workout not found');

    const exercise = await this.prisma.exercise.findFirst({
      where: { id: dto.exerciseId, status: ExerciseStatus.PUBLISHED },
      select: { id: true },
    });
    if (!exercise) throw new NotFoundException('Published exercise not found');

    return this.prisma.workoutSet.create({
      data: {
        workoutSessionId: workoutId,
        exerciseId: dto.exerciseId,
        setNumber: dto.setNumber,
        ...(dto.reps !== undefined ? { reps: dto.reps } : {}),
        ...(dto.loadKg !== undefined ? { loadKg: dto.loadKg } : {}),
        ...(dto.durationSeconds !== undefined ? { durationSeconds: dto.durationSeconds } : {}),
        ...(dto.completed !== undefined ? { completed: dto.completed } : {}),
      },
      select: {
        id: true,
        exerciseId: true,
        setNumber: true,
        reps: true,
        loadKg: true,
        durationSeconds: true,
        completed: true,
      },
    });
  }

  async complete(userId: string, workoutId: string, dto: CompleteWorkoutDto) {
    const result = await this.prisma.workoutSession.updateMany({
      where: { id: workoutId, userId, status: WorkoutStatus.IN_PROGRESS },
      data: {
        status: WorkoutStatus.COMPLETED,
        completedAt: new Date(),
        ...(dto.perceivedEffort !== undefined ? { perceivedEffort: dto.perceivedEffort } : {}),
        ...(dto.feedback !== undefined ? { feedback: dto.feedback.trim() || null } : {}),
      },
    });
    if (result.count === 0) throw new NotFoundException('Active workout not found');
    return this.get(userId, workoutId);
  }
}
