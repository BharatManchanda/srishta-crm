import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
  MinLength,
  IsOptional,
} from 'class-validator';
import { OtpPurpose } from '@prisma/client';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;

  @ValidateIf((o) => o.purpose === OtpPurpose.EMAIL_VERIFICATION)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateIf((o) => o.purpose === OtpPurpose.EMAIL_VERIFICATION)

  // @IsOptional()
  // @IsString()
  // @IsNotEmpty()
  // phone?: string;
  @ValidateIf((o) => o.purpose === OtpPurpose.EMAIL_VERIFICATION)
  @IsString()
  @MinLength(6)
  password?: string;

  @ValidateIf((o) => o.purpose === OtpPurpose.EMAIL_VERIFICATION)
  @IsString()
  @MinLength(6)
  confirmPassword?: string;
}
