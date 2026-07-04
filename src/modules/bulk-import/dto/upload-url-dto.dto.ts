import { IsNotEmpty, IsString, Matches } from "class-validator";

export class UploadUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]+\/[a-z0-9+.-]+$/i, {
    message: "mimeType must be a valid MIME type",
  })
  mimeType: string;
}