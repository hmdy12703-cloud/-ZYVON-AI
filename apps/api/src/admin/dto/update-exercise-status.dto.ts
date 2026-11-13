import { ExerciseStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateExerciseStatusDto {
  @IsEnum(ExerciseStatus)
  status!: ExerciseStatus;
}
