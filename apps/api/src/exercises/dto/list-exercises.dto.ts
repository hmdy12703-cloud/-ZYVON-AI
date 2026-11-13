import { Type } from 'class-transformer';
import { ExperienceLevel } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class ListExercisesDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(80)
  q?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(ExperienceLevel)
  difficulty?: ExperienceLevel;
}
