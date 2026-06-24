import { UserStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsNumber, IsIn } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class UserFilterDto extends PaginationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsEnum(UserStatus)
    @Transform(({ value }) => value === '' ? undefined : value)
    status?: UserStatus;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
    roleId?: number

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}