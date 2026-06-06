import { UserStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsPhoneNumber,
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
  status: UserStatus
  
}