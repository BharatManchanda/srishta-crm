import {
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsDateString,
  IsEnum,
  IsInt,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import { LeadSource } from '@prisma/client';
import { AddressDto } from './address.dto';

export class ContactUpdateDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  // @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsString()
  fax?: string;

  @IsOptional()
  @IsString()
  assistant?: string;

  @IsOptional()
  // @IsPhoneNumber()
  assistantPhone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  skypeId?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Replace mailingAddressId
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  mailingAddress?: AddressDto;

  // Replace otherAddressId
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  otherAddress?: AddressDto;

  @IsOptional()
  @IsInt()
  ownerId?: number;
}
