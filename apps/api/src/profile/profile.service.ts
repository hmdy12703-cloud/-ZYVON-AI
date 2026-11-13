import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile has not been created yet');
    return profile;
  }

  async updateForUser(userId: string, email: string, dto: UpdateProfileDto) {
    const { equipment, birthDate, displayName, ...fields } = dto;
    const data: Prisma.UserProfileUpdateInput = {
      ...fields,
      ...(displayName !== undefined ? { displayName } : {}),
      ...(birthDate === null ? { birthDate: null } : birthDate !== undefined ? { birthDate: new Date(birthDate) } : {}),
      ...(equipment !== undefined
        ? { equipment: equipment as Prisma.InputJsonValue }
        : {}),
    };
    const createData: Prisma.UserProfileCreateInput = {
      user: { connect: { id: userId } },
      ...fields,
      displayName: displayName ?? email.split('@')[0].slice(0, 60),
      ...(birthDate === null ? { birthDate: null } : birthDate !== undefined ? { birthDate: new Date(birthDate) } : {}),
      ...(equipment !== undefined
        ? { equipment: equipment as Prisma.InputJsonValue }
        : {}),
    };

    // Do not permit a birth date in the future or an implausible age.
    if (birthDate) {
      const date = new Date(birthDate);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (date > now || age > 120) {
        throw new BadRequestException('Birth date is outside the allowed range');
      }
    }

    return this.prisma.userProfile.upsert({
      where: { userId },
      create: createData,
      update: data,
    });
  }
}
