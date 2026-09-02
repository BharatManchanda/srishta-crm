import { IsNotEmpty, IsString, Matches } from "class-validator";

export class BlogsUploadUrlDto {
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