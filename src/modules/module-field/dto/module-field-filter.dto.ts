import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { FieldType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class ModuleFieldFilterDto extends PaginationDto{
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  moduleId?: number;


  @IsOptional()
  @IsString()
  name?: string;


  @IsOptional()
  @IsString()
  label?: string;


  @IsOptional()
  @IsEnum(FieldType)
  type?: FieldType;


  @IsOptional()
  @IsBoolean()
  required?: boolean;


  @IsOptional()
  sortBy?: string;


  @IsOptional()
  sortOrder?: 'asc' | 'desc';

}