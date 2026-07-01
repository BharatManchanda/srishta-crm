import { MeetingEntityType, MeetingStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsIn, IsInt, IsDate } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class MeetingFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsEnum(MeetingEntityType)
  @Transform(({ value }) => value || undefined)
  entityType?: MeetingEntityType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(MeetingStatus)
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: MeetingStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTimeFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTimeTo?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTimeFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTimeTo?: Date;

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
