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
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class LeadCreateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsString()
  phone: string;

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
  status: LeadStatus;

  @IsEnum(LeadPriority)
  priority: LeadPriority;

  @IsOptional()
  @IsEnum(LeadRating)
  rating: LeadRating;

  @IsOptional()
  @IsNumber()
  leadScore: number;

  @IsBoolean()
  isQualified: boolean;

  @IsBoolean()
  isConverted: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextFollowUpDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastFollowUpDate?: Date;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  ownerId?: number;
}
