import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PlanStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

    const exercises = await this.prisma.exercise.findMany({
      where: { status: 'PUBLISHED', difficulty: profile.experienceLevel },
      orderBy: { nameEn: 'asc' },
      take: 30,
      select: { id: true, nameAr: true, nameEn: true },
    });
    if (exercises.length < 3) {
      throw new BadRequestException('At least three published exercises for your experience level are required');
    }

    const dayCount = Math.min(6, Math.max(1, profile.trainingDaysPerWeek));
    const title = profile.preferredLanguage === 'ar'
      ? 'خطتي التدريبية الشخصية'
      : 'My Personal Training Plan';

    return this.prisma.trainingPlan.create({
      data: {
        userId,
        title,
        goal: profile.goal,
        status: PlanStatus.DRAFT,
        days: {
          create: Array.from({ length: dayCount }, (_, dayIndex) => {
            const chosen = Array.from({ length: Math.min(5, exercises.length) }, (_, index) =>
              exercises[(dayIndex * 3 + index) % exercises.length],
            );
            return {
              dayNumber: dayIndex + 1,
              title: profile.preferredLanguage === 'ar' ? `اليوم ${dayIndex + 1}` : `Day ${dayIndex + 1}`,
              notes: 'Start with a comfortable warm-up. Stop if you feel pain or unusual symptoms.',
              exercises: {
                create: chosen.map((exercise, index) => ({
                  exerciseId: exercise.id,
                  sortOrder: index + 1,
                  sets: 3,
                  repsMin: 8,
                  repsMax: 12,
                  restSeconds: 60,
                })),
              },
            };
          }),
        },
      },
      include: {
        days: { orderBy: { dayNumber: 'asc' }, include: { exercises: { include: { exercise: true } } } },
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
