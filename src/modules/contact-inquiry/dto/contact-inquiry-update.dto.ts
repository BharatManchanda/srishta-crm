import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ContactInquiryPriority, ContactInquiryStatus, ContactInquiryType } from '@prisma/client';
import { Type } from 'class-transformer';

export class ContactInquiryUpdateDto {
    @IsString()
    @IsOptional()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsEmail()
    @IsOptional()
    @MaxLength(150)
    email: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    company?: string;

    @IsOptional()
    @IsUrl()
    @MaxLength(255)
    website?: string;

    @IsOptional()
    @IsEnum(ContactInquiryType)
    inquiryType: ContactInquiryType;

    @IsOptional()
    @IsString()
    // @MinLength(10)
    // @MaxLength(5000)
    message: string;

    @IsOptional()
    @IsEnum(ContactInquiryStatus)
    status: ContactInquiryStatus;

    @IsOptional()
    @IsEnum(ContactInquiryPriority)
    priority: ContactInquiryPriority;

    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    resolvedAt?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    closedAt?: Date;
}