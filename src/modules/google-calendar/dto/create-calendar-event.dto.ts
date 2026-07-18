import { IsString, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  start: string;

  @IsDateString()
  end: string;
}