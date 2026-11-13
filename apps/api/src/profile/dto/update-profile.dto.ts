import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsNotEmpty,
  ValidateIf,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Language, FitnessGoal, ExperienceLevel } from '@prisma/client';

export class UpdateProfileDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  displayName?: string;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsDateString()
  birthDate?: string | null;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(100)
  @Max(230)
  heightCm?: number | null;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(25)
  @Max(350)
  weightKg?: number | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(Language)
  preferredLanguage?: Language;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(FitnessGoal)
  goal?: FitnessGoal;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(10)
  @Max(180)
  sessionMinutes?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  equipment?: string[];

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(1000)
  safetyNotes?: string | null;
}
