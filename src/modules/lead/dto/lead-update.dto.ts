import {
  LeadPriority,
  LeadRating,
  LeadSource,
  LeadStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LeadUpdateDto {
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
  website: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  pinCode: string;

  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  budget: number;

  @IsOptional()
  @IsString()
  requirement: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source: LeadSource;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @IsOptional()
  @IsEnum(LeadRating)
  rating?: LeadRating;

  @IsOptional()
  @IsNumber()
  leadScore?: number;

  @IsOptional()
  @IsBoolean()
  isQualified?: boolean;

  @IsOptional()
  @IsBoolean()
  isConverted?: boolean;

  @IsOptional()
  @IsNumber()
  assignedToId: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextFollowUpDate: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastFollowUpDate: Date;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  ownerId?: number;
}
