import { LeadSource } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsIn,
  IsInt,
  IsDate,
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
  @IsString()
  fax?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  @Transform(({ value }) => value || undefined)
  source?: LeadSource;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  assistant?: string;

  // Date filters
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirthFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirthTo?: Date;

  @IsOptional()
  @IsString()
  assistantPhone?: string;

  @IsOptional()
  @IsString()
  skypeId?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdTo?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedTo?: Date;

  // Relation filters
  @IsOptional()
  ['mailingAddress.city']?: string;

  @IsOptional()
  ['mailingAddress.country']?: string;

  @IsOptional()
  ['mailingAddress.stateProvince']?: string;

  @IsOptional()
  ['mailingAddress.streetAddress']?: string;

  @IsOptional()
  ['mailingAddress.postalCode']?: string;

  @IsOptional()
  ['otherAddress.city']?: string;

  @IsOptional()
  ['otherAddress.country']?: string;

  @IsOptional()
  ['otherAddress.stateProvince']?: string;

  @IsOptional()
  ['otherAddress.streetAddress']?: string;

  @IsOptional()
  ['otherAddress.postalCode']?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
