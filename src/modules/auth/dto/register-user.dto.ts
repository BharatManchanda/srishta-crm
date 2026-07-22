import { AccessLevel, UserStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
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
}