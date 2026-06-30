import { IsOptional, IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class NoteUpdateDto {
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
