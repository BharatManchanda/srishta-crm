import { CallEntityType, CallPurpose, CallResult, CallStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsDate } from 'class-validator';

export class CallCreateDto {
  @IsOptional()
  @IsEnum(CallEntityType)
  entityType?: CallEntityType;

  @IsOptional()
  @IsInt()
  entityId?: number;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @IsEnum(CallPurpose)
  purpose?: CallPurpose;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CallResult)
  result?: CallResult;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  callStartTime?: Date;

  @IsOptional()
  @IsInt()
  callDuration?: number;

  @IsOptional()
  @IsEnum(CallStatus)
  status?: CallStatus;
}
