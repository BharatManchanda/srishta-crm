import { DealLeadSource, DealStage, DealType, } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsIn, IsNumber, IsInt, } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class DealFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  @IsEnum(DealLeadSource)
  @Transform(({ value }) => (value === '' ? undefined : value))
  leadSource?: DealLeadSource;

  @IsOptional()
  @IsEnum(DealStage)
  @Transform(({ value }) => (value === '' ? undefined : value))
  stage?: DealStage;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minProbability?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxProbability?: number;

  @IsOptional()
  @IsString()
  closingDate?: string;

  @IsOptional()
  @IsString()
  socialLeadId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ownerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  accountId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contactId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  createdById?: number;

  @IsOptional()
  @IsEnum(DealType)
  @Transform(({ value }) => (value === '' ? undefined : value))
  type?: DealType;

  @IsOptional()
  @IsString()
  nextStep?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  updatedAt?: string;

}