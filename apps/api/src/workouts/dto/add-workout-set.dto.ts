import { IsBoolean, IsInt, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AddWorkoutSetDto {
  @IsUUID()
  exerciseId!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  setNumber!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  reps?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  loadKg?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(86400)
  durationSeconds?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
