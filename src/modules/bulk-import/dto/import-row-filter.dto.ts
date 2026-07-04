import { ImportRowStatus, ImportEntity } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsIn, IsInt } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class ImportRowFilterDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  importJobId?: number;

  @IsOptional()
  @IsEnum(ImportRowStatus)
  status?: ImportRowStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ImportEntity)
  entity?: ImportEntity;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
