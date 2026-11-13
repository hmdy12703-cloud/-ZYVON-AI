import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExperienceLevel, PlanStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildPlanDays } from './plan-programming';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.trainingPlan.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, goal: true, status: true, startDate: true, endDate: true,
        _count: { select: { days: true } },
      },
    });
  }

  async get(userId: string, planId: string) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id: planId, userId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            exercises: {
              orderBy: { sortOrder: 'asc' },
              include: { exercise: { select: { id: true, slug: true, nameAr: true, nameEn: true, difficulty: true } } },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Training plan not found');
    return plan;
  }

  async generate(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('Complete your fitness profile before generating a plan');

    const allowedLevels = profile.experienceLevel === ExperienceLevel.BEGINNER
      ? [ExperienceLevel.BEGINNER]
      : profile.experienceLevel === ExperienceLevel.INTERMEDIATE
        ? [ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE]
        : [ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE, ExperienceLevel.ADVANCED];

    const exercises = await this.prisma.exercise.findMany({
      where: { status: 'PUBLISHED', difficulty: { in: allowedLevels } },
      orderBy: { nameEn: 'asc' },
      take: 100,
      select: { id: true, nameAr: true, nameEn: true, difficulty: true, equipment: true },
    });

    let days;
    try {
      days = buildPlanDays(profile, exercises);
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_ENOUGH_SUITABLE_EXERCISES') {
        throw new BadRequestException(
          'Not enough published exercises match your experience level and available equipment. Update your equipment or ask an administrator to add suitable exercises.',
        );
      }
      throw error;
    }

    const title = profile.preferredLanguage === 'ar'
      ? 'خطتي التدريبية الشخصية'
      : 'My Personal Training Plan';

    return this.prisma.trainingPlan.create({
      data: {
        userId,
        title,
        goal: profile.goal,
        status: PlanStatus.DRAFT,
        days: { create: days },
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: { exercises: { include: { exercise: true } } },
        },
      },
    });
  }

  async activate(userId: string, planId: string) {
    const plan = await this.prisma.trainingPlan.findFirst({ where: { id: planId, userId }, select: { id: true } });
    if (!plan) throw new NotFoundException('Training plan not found');
    await this.prisma.$transaction([
      this.prisma.trainingPlan.updateMany({
        where: { userId, status: PlanStatus.ACTIVE, id: { not: planId } },
        data: { status: PlanStatus.ARCHIVED },
      }),
      this.prisma.trainingPlan.update({
        where: { id: planId },
        data: { status: PlanStatus.ACTIVE, startDate: new Date() },
      }),
    ]);
    return this.get(userId, planId);
  }
}
