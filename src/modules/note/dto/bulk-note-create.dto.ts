import { NoteEntityType } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

export class BulkNoteCreateDto {
  @IsEnum(NoteEntityType)
  entityType: NoteEntityType;

  @IsArray()
  @IsInt({ each: true })
  entityIds: number[];

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
