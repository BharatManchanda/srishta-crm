import { DealLeadSource, DealStage, DealType } from '@prisma/client';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class DealUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsEnum(DealLeadSource)
  leadSource?: DealLeadSource;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  probability?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  closingDate?: Date;

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
  @IsEnum(DealType)
  type?: DealType;

  @IsOptional()
  @IsString()
  nextStep?: string;
}