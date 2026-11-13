import { Injectable, NotFoundException } from '@nestjs/common';
import { ExerciseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListExercisesDto } from './dto/list-exercises.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListExercisesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ExerciseWhereInput = {
      status: ExerciseStatus.PUBLISHED,
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
      ...(query.q?.trim()
        ? {
            OR: [
              { nameAr: { contains: query.q.trim(), mode: 'insensitive' } },
              { nameEn: { contains: query.q.trim(), mode: 'insensitive' } },
              { slug: { contains: query.q.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exercise.findMany({
        where,
        orderBy: [{ nameEn: 'asc' }, { slug: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          descriptionAr: true,
          descriptionEn: true,
          primaryMuscles: true,
          equipment: true,
          difficulty: true,
          media: {
            orderBy: { sortOrder: 'asc' },
            select: { type: true, url: true, language: true, altTextAr: true, altTextEn: true },
          },
        },
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBySlug(slug: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug, status: ExerciseStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        descriptionAr: true,
        descriptionEn: true,
        instructionsAr: true,
        instructionsEn: true,
        primaryMuscles: true,
        equipment: true,
        difficulty: true,
        safetyNotesAr: true,
        safetyNotesEn: true,
        media: {
          orderBy: { sortOrder: 'asc' },
          select: { type: true, url: true, language: true, altTextAr: true, altTextEn: true },
        },
      },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }
}
