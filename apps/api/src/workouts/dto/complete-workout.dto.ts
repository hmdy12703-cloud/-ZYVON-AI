import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CompleteWorkoutDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  perceivedEffort?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}
