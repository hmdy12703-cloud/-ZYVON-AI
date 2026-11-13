import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CoachMessageDto {
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(1000)
  message!: string;
}
