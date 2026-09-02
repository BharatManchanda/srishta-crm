import { AccessLevel, UserStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsNumber, IsIn } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class UserFilterDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined,
  )
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: UserStatus;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined,
  )
  roleId?: number;

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
  @IsEnum(AccessLevel)
  @Transform(({ value }) => (value === '' ? undefined : value))
  accessLevel?: AccessLevel;

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
  @IsNumber()
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined,
  )
  companyId?: number;

}
