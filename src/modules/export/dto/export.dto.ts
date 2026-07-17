import { IsEnum, IsString } from "class-validator"

export enum ExportModule {
  USER = "USER",
  LEAD = "LEAD",
  CONTACT = "CONTACT",
  ACCOUNT = "ACCOUNT",
}
export class ExportDto {
  @IsEnum(ExportModule)
  entity?: ExportModule
  
  @IsString()
  fieldsToExport?: string
}
