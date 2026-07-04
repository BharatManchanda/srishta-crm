import { ImportEntity, ImportStatus } from '@prisma/client';
import { IsOptional, IsString, IsEnum, IsIn } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class ImportJobFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ImportEntity)
  entity?: ImportEntity;

  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
