import { MeetingEntityType, MeetingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsDate, IsArray, ValidateNested } from 'class-validator';
import { MeetingParticipantDto } from './meeting-participant.dto';

export class MeetingCreateDto {
  @IsOptional()
  @IsEnum(MeetingEntityType)
  entityType?: MeetingEntityType;

  @IsOptional()
  @IsInt()
  entityId?: number;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingParticipantDto)
  participants?: MeetingParticipantDto[];
}
