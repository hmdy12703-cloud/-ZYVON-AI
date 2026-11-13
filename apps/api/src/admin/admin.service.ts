import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ExerciseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseStatusDto } from './dto/update-exercise-status.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [users, exercises, publishedExercises, draftExercises, plans, workouts, nutritionLogs, feedbackEntries] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.exercise.count(),
      this.prisma.exercise.count({ where: { status: ExerciseStatus.PUBLISHED } }),
      this.prisma.exercise.count({ where: { status: ExerciseStatus.DRAFT } }),
      this.prisma.trainingPlan.count(),
      this.prisma.workoutSession.count(),
      this.prisma.nutritionLog.count(),
      this.prisma.userFeedback.count(),
    ]);
    return { users, exercises, publishedExercises, draftExercises, plans, workouts, nutritionLogs, feedbackEntries };
  }

  listFeedback() {
    return this.prisma.userFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, category: true, rating: true, comment: true, createdAt: true,
        user: { select: { email: true } },
      },
    });
  }

  listExercises() {
    return this.prisma.exercise.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, slug: true, nameAr: true, nameEn: true, difficulty: true, status: true, createdAt: true,
      },
    });
  }

  async createExercise(dto: CreateExerciseDto) {
    try {
      return await this.prisma.exercise.create({
        data: {
          slug: dto.slug,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          descriptionAr: dto.descriptionAr,
          descriptionEn: dto.descriptionEn,
          instructionsAr: dto.instructionsAr,
          instructionsEn: dto.instructionsEn,
          primaryMuscles: dto.primaryMuscles as Prisma.InputJsonValue,
          equipment: dto.equipment as Prisma.InputJsonValue,
          difficulty: dto.difficulty,
          safetyNotesAr: dto.safetyNotesAr,
          safetyNotesEn: dto.safetyNotesEn,
          status: ExerciseStatus.DRAFT,
        },
        select: { id: true, slug: true, nameAr: true, nameEn: true, status: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An exercise with this slug already exists');
      }
      throw error;
    }
  }


  async updateExercise(id: string, dto: CreateExerciseDto) {
    try {
      return await this.prisma.exercise.update({
        where: { id },
        data: {
          slug: dto.slug,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          descriptionAr: dto.descriptionAr,
          descriptionEn: dto.descriptionEn,
          instructionsAr: dto.instructionsAr,
          instructionsEn: dto.instructionsEn,
          primaryMuscles: dto.primaryMuscles as Prisma.InputJsonValue,
          equipment: dto.equipment as Prisma.InputJsonValue,
          difficulty: dto.difficulty,
          safetyNotesAr: dto.safetyNotesAr,
          safetyNotesEn: dto.safetyNotesEn,
        },
        select: { id: true, slug: true, nameAr: true, nameEn: true, difficulty: true, status: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An exercise with this slug already exists');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Exercise not found');
      }
      throw error;
    }
  }

  async updateExerciseStatus(id: string, dto: UpdateExerciseStatusDto) {
    try {
      return await this.prisma.exercise.update({
        where: { id },
        data: { status: dto.status },
        select: { id: true, slug: true, nameAr: true, nameEn: true, status: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Exercise not found');
      }
      throw error;
    }
  }
}
