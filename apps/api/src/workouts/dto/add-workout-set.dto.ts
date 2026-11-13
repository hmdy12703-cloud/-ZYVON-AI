import { IsBoolean, IsInt, IsNumber, ValidateIf, IsUUID, Max, Min } from 'class-validator';

export class AddWorkoutSetDto {
  @IsUUID()
  exerciseId!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  setNumber!: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(1000)
  reps?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  loadKg?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(86400)
  durationSeconds?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  completed?: boolean;
}
