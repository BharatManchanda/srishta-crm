import { IsEnum, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export enum ModuleName {
    LEAD = "lead",
    USER = "user",
    ACCOUNT = "account",
    CONTACT = "contact",
    NOTE = "note",
    TASK = "task",
    MEETING = "meeting",
    CALL = "call",
    ATTACHMENT = "attachment",
}
export class SearchDto {
  @IsString()
  q: string;

  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(ModuleName)
  module?: ModuleName;
}