import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Language, FitnessGoal, ExperienceLevel } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  displayName?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(100)
  @Max(230)
  heightCm?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(25)
  @Max(350)
  weightKg?: number;

  @IsOptional()
  @IsEnum(Language)
  preferredLanguage?: Language;

  @IsOptional()
  @IsEnum(FitnessGoal)
  goal?: FitnessGoal;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(180)
  sessionMinutes?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  equipment?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  safetyNotes?: string | null;
}
