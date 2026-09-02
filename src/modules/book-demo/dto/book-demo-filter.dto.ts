import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { Type } from 'class-transformer';
import { BookDemoStatus } from '@prisma/client';

export class BookDemoFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  company?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  teamSize?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  industry?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message?: string;

  @IsOptional()
  @IsEnum(BookDemoStatus)
  @IsNotEmpty()
  status?: BookDemoStatus;
}
