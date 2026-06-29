import { LeadStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsIn, IsNumber } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class LeadFilterDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined,
  )
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
