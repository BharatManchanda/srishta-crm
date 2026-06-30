import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
  Min,
} from "class-validator";

import { Type } from "class-transformer";
import { AttachmentOwnerType, AttachmentType } from "@prisma/client";

export class AttachmentCreateDto {
  @IsEnum(AttachmentOwnerType)
  entityType: AttachmentOwnerType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  entityId: number;

  @IsEnum(AttachmentType)
  type: AttachmentType;

  // Required for LINK
  @ValidateIf((o) => o.type === AttachmentType.LINK)
  @IsUrl()
  url?: string;

  // Required for FILE
  @ValidateIf((o) => o.type === AttachmentType.FILE)
  @IsString()
  fileName?: string;

  @ValidateIf((o) => o.type === AttachmentType.FILE)
  @IsString()
  mimeType?: string;

  @ValidateIf((o) => o.type === AttachmentType.FILE)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;

  @IsOptional()
  @IsString()
  title?: string;
}