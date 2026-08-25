import { PricingPlanStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class PricingPlanFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  popular?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PricingPlanStatus)
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: PricingPlanStatus;
}
