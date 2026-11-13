import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateNutritionLogDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  calories?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(1000)
  proteinGrams?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(1000)
  carbsGrams?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(1000)
  fatGrams?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
