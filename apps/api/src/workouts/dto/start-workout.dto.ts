import { IsOptional, IsUUID } from 'class-validator';

export class StartWorkoutDto {
  @IsOptional()
  @IsUUID()
  trainingPlanId?: string;
}
