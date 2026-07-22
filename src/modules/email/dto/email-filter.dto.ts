import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { EmailEntityType, EmailStatus } from '@prisma/client';

export class EmailFilterDto extends PaginationDto {
    @IsOptional()
    @IsEnum(EmailEntityType)
    entityType?: EmailEntityType;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    entityId?: number;

    @IsOptional()
    @IsEnum(EmailStatus)
    status?: EmailStatus;

    @IsOptional()
    @IsString()
    search?: string;
}
