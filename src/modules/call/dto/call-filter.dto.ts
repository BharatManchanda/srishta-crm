import { CallEntityType, CallPurpose, CallResult, CallStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsIn, IsInt, IsDate } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class CallFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsEnum(CallEntityType)
  @Transform(({ value }) => value || undefined)
  entityType?: CallEntityType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsEnum(CallPurpose)
  @Transform(({ value }) => (value === '' ? undefined : value))
  purpose?: CallPurpose;

  @IsOptional()
  @IsEnum(CallStatus)
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: CallStatus;

  @IsOptional()
  @IsEnum(CallResult)
  @Transform(({ value }) => (value === '' ? undefined : value))
  result?: CallResult;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  callStartTimeFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  callStartTimeTo?: Date;

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

}
