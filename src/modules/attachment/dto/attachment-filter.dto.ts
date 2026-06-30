import { AttachmentOwnerType, AttachmentType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsIn,
  IsInt,
  IsDate,
} from 'class-validator';

import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class AttachmentFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsEnum(AttachmentOwnerType)
  @Transform(({ value }) => value || undefined)
  entityType?: AttachmentOwnerType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;

  @IsOptional()
  @IsEnum(AttachmentType)
  @Transform(({ value }) => value || undefined)
  type?: AttachmentType;

  @IsOptional()
  @IsString()
  title?: string;

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
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
