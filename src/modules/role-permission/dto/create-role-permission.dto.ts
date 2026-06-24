import { UserStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsNumber, IsIn, IsBoolean } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class CreateRolePermissionDto {

    @IsNumber()
    roleId: number

    @IsNumber()
    moduleId: number

    @IsBoolean()
    isAllow: boolean

    @IsBoolean()
    canView: boolean

    @IsBoolean()
    canCreate: boolean

    @IsBoolean()
    canEdit: boolean

    @IsBoolean()
    canDelete: boolean
}