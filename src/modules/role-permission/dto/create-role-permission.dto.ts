import { IsNumber, IsBoolean, } from 'class-validator';

export class CreateRolePermissionDto {
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
}
