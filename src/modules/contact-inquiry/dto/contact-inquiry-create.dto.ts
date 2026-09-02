import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ContactInquiryType } from '@prisma/client';

export class ContactInquiryCreateDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsEmail()
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

    @IsEnum(ContactInquiryType)
    inquiryType: ContactInquiryType;

    @IsString()
    @MinLength(10)
    @MaxLength(5000)
    message: string;
}