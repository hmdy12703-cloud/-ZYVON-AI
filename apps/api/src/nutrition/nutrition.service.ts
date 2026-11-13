import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNutritionLogDto } from './dto/create-nutrition-log.dto';

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.nutritionLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        loggedAt: true,
        calories: true,
        proteinGrams: true,
        carbsGrams: true,
        fatGrams: true,
        notes: true,
      },
    });
  }

  create(userId: string, dto: CreateNutritionLogDto) {
    if (
      dto.calories === undefined &&
      dto.proteinGrams === undefined &&
      dto.carbsGrams === undefined &&
      dto.fatGrams === undefined
    ) {
      throw new BadRequestException('Provide at least one nutrition value');
    }
    return this.prisma.nutritionLog.create({
      data: {
        userId,
        ...(dto.calories !== undefined ? { calories: dto.calories } : {}),
        ...(dto.proteinGrams !== undefined ? { proteinGrams: dto.proteinGrams } : {}),
        ...(dto.carbsGrams !== undefined ? { carbsGrams: dto.carbsGrams } : {}),
        ...(dto.fatGrams !== undefined ? { fatGrams: dto.fatGrams } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      select: {
        id: true,
        loggedAt: true,
        calories: true,
        proteinGrams: true,
        carbsGrams: true,
        fatGrams: true,
        notes: true,
      },
    });
  }
}
