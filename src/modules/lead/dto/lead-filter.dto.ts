import { LeadStatus, LeadSource, LeadPriority, LeadRating } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsIn, IsNumber, IsBoolean, IsInt } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class LeadFilterDto extends PaginationDto {
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
  website?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  requirement?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  @Transform(({ value }) => (value === '' ? undefined : value))
  source?: LeadSource;

  @IsOptional()
  @IsEnum(LeadStatus)
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadPriority)
  @Transform(({ value }) => (value === '' ? undefined : value))
  priority?: LeadPriority;

  @IsOptional()
  @IsEnum(LeadRating)
  @Transform(({ value }) => (value === '' ? undefined : value))
  rating?: LeadRating;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  leadScore?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === 'yes' || value === '1') return true;
    if (value === 'false' || value === 'no' || value === '0') return false;
    return undefined;
  })
  isQualified?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === 'yes' || value === '1') return true;
    if (value === 'false' || value === 'no' || value === '0') return false;
    return undefined;
  })
  isConverted?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assignedToId?: number;

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  updatedAt?: string;

  @IsOptional()
  @IsString()
  nextFollowUpDate?: string;

  @IsOptional()
  @IsString()
  lastFollowUpDate?: string;

}
