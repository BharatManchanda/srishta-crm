import { NoteEntityType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class NoteCreateDto {
  @IsEnum(NoteEntityType)
  entityType: NoteEntityType;

  @IsInt()
  entityId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
