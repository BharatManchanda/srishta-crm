import { IsOptional, IsString, IsNotEmpty, IsInt, Min, IsUrl } from 'class-validator';

export class AttachmentUpdateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fileName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  originalName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  size?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  storageKey?: string;

  @IsOptional()
  @IsUrl()
  url?: string;
}
