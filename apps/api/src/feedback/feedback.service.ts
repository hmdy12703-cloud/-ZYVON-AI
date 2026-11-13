import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateFeedbackDto) {
    return this.prisma.userFeedback.create({
      data: { userId, category: dto.category.trim(), rating: dto.rating, comment: dto.comment?.trim() || null },
      select: { id: true, category: true, rating: true, comment: true, createdAt: true },
    });
  }

  listMine(userId: string) {
    return this.prisma.userFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, category: true, rating: true, comment: true, createdAt: true },
    });
  }
}
