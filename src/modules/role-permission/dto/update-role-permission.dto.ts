import { IsNumber, IsBoolean, IsOptional, IsArray, IsString } from 'class-validator';

export class UpdateRolePermissionDto {
  @IsNumber()
  roleId: number;

  @IsNumber()
  moduleId: number;

  @IsBoolean()
  isAllow: boolean;

  @IsBoolean()
  canView: boolean;

  @IsBoolean()
  canCreate: boolean;

  @IsBoolean()
  canEdit: boolean;

  @IsBoolean()
  canDelete: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actions?: string[];
}
