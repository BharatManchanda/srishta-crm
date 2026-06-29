import { AccountType, AccountRating, OwnershipType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsIn,
  IsInt,
  IsDate,
  IsNumber,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class AccountFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  accountSite?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentAccountId?: number;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsEnum(AccountType)
  @Transform(({ value }) => value || undefined)
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annualRevenueFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annualRevenueTo?: number;

  @IsOptional()
  @IsEnum(AccountRating)
  @Transform(({ value }) => value || undefined)
  rating?: AccountRating;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  fax?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  tickerSymbol?: string;

  @IsOptional()
  @IsEnum(OwnershipType)
  @Transform(({ value }) => value || undefined)
  ownership?: OwnershipType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeesFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeesTo?: number;

  @IsOptional()
  @IsString()
  sicCode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdTo?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedTo?: Date;

  // Relation filters: Billing Address
  @IsOptional()
  ['billingAddress.city']?: string;

  @IsOptional()
  ['billingAddress.country']?: string;

  @IsOptional()
  ['billingAddress.stateProvince']?: string;

  @IsOptional()
  ['billingAddress.streetAddress']?: string;

  @IsOptional()
  ['billingAddress.postalCode']?: string;

  // Relation filters: Shipping Address
  @IsOptional()
  ['shippingAddress.city']?: string;

  @IsOptional()
  ['shippingAddress.country']?: string;

  @IsOptional()
  ['shippingAddress.stateProvince']?: string;

  @IsOptional()
  ['shippingAddress.streetAddress']?: string;

  @IsOptional()
  ['shippingAddress.postalCode']?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
