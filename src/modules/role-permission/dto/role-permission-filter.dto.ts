import { Transform } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

export class RolePermissionFilterDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined,
  )
  roleId?: number;
}
