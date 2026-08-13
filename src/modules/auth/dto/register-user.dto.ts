import { AccessLevel, UserStatus } from '@prisma/client';
import {
  IsDecimal,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsNumber()
  roleId: number;

  @IsEnum(UserStatus)
  status: UserStatus;

  @IsEnum(AccessLevel)
  accessLevel: AccessLevel;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  tax_id?: string;

  @IsOptional()
  @IsString()
  facebookLink?: string;

  @IsOptional()
  @IsString()
  twitterLink?: string;

  @IsOptional()
  @IsString()
  linkdinLink?: string;

  @IsOptional()
  @IsString()
  instagramLink?: string;

  @IsOptional()
  @IsString()
  websiteLink?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companyPhone?: string;

  @IsOptional()
  @IsString()
  companyEmail?: string;

  @IsOptional()
  @IsInt()
  employees?: number;

  @IsOptional()
  @IsString()
  companyCountry?: string;

  @IsOptional()
  @IsString()
  companyCity?: string;

  @IsOptional()
  @IsInt()
  companyPincode?: number;

  @IsOptional()
  @IsDecimal()
  annualRevenue?: string;
}