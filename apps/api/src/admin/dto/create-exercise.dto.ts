import { ExperienceLevel } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug!: string;

  @IsString()
  @Length(2, 100)
  nameAr!: string;

  @IsString()
  @Length(2, 100)
  nameEn!: string;

  @IsString()
  @Length(2, 1000)
  descriptionAr!: string;

  @IsString()
  @Length(2, 1000)
  descriptionEn!: string;

  @IsString()
  @Length(2, 3000)
  instructionsAr!: string;

  @IsString()
  @Length(2, 3000)
  instructionsEn!: string;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  primaryMuscles!: string[];

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  equipment!: string[];

  @IsEnum(ExperienceLevel)
  difficulty!: ExperienceLevel;

  @IsString()
  @Length(2, 1000)
  safetyNotesAr!: string;

  @IsString()
  @Length(2, 1000)
  safetyNotesEn!: string;
}
