import { MeetingParticipantType, MeetingResponseStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsEmail } from 'class-validator';

export class MeetingParticipantDto {
  @IsEnum(MeetingParticipantType)
  participantType: MeetingParticipantType;

  @IsOptional()
  @IsInt()
  participantId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(MeetingResponseStatus)
  responseStatus?: MeetingResponseStatus;
}
