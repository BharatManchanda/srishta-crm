import { NoteEntityType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsIn,
  IsInt,
  IsDate,
  IsBoolean,
} from 'class-validator';

import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class NoteFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsEnum(NoteEntityType)
  @Transform(({ value }) => value || undefined)
  entityType?: NoteEntityType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

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

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
