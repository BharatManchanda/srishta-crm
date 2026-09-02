import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsIn,
  IsInt,
  IsDate,
  IsBoolean,
  IsNumber,
} from 'class-validator';

import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class PaymentFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;
  
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  updatedTo?: Date;

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined,
  )
  companyId?: number;
}
