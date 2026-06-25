import { LeadSource } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsIn,
  IsInt,
} from 'class-validator';

import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class ContactFilterDto extends PaginationDto {

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  @Transform(({ value }) => (value === '' ? undefined : value))
  source?: LeadSource;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  assistant?: string;

  @IsOptional()
  @IsString()
  skypeId?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  // Mailing Address Filters
  @IsOptional()
  @IsString()
  mailingCountry?: string;

  @IsOptional()
  @IsString()
  mailingCity?: string;

  @IsOptional()
  @IsString()
  mailingState?: string;

  // Other Address Filters
  @IsOptional()
  @IsString()
  otherCountry?: string;

  @IsOptional()
  @IsString()
  otherCity?: string;

  @IsOptional()
  @IsString()
  otherState?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}