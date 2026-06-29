import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType, AccountRating, OwnershipType } from '@prisma/client';
import { AddressDto } from './address.dto';

export class AccountCreateDto {
  @IsString()
  accountName: string;

  @IsOptional()
  @IsString()
  accountSite?: string;

  @IsOptional()
  @IsInt()
  parentAccountId?: number;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  annualRevenue?: number;

  @IsOptional()
  @IsEnum(AccountRating)
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
  ownership?: OwnershipType;

  @IsOptional()
  @IsInt()
  employees?: number;

  @IsOptional()
  @IsString()
  sicCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;

  @IsOptional()
  @IsString()
  description?: string;
}
