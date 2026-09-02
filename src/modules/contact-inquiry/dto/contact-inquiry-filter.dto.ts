import { ContactInquiryPriority, ContactInquiryStatus, ContactInquiryType, LeadSource } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsDate,
} from 'class-validator';

import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class ContactInquiryFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsEnum(ContactInquiryType)
  @Transform(({ value }) => value || undefined)
  inquiryType?: ContactInquiryType;

  @IsOptional()
  @IsEnum(ContactInquiryStatus)
  @Transform(({ value }) => value || undefined)
  status?: ContactInquiryStatus;

  @IsOptional()
  @IsEnum(ContactInquiryPriority)
  @Transform(({ value }) => value || undefined)
  priority?: ContactInquiryPriority;

  @IsOptional()
  @IsString()
  source?: string;

}
