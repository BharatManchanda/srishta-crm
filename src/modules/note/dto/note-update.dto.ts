import { IsOptional, IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class NoteUpdateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
