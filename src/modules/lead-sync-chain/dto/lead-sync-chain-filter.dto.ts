import { IsEnum, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { LeadSyncChainProvider, LeadSyncModule, LeadSyncStatus } from '@prisma/client';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class LeadSyncChainFilterDto extends PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    facebookAccountId?: number;

    @IsOptional()
    @IsString()
    facebookAdAccountId?: string;

    @IsOptional()
    @IsString()
    facebookPageId?: string;

    @IsOptional()
    @IsString()
    facebookFormId?: string;

    @IsOptional()
    @IsEnum(LeadSyncModule)
    module?: LeadSyncModule;

    @IsOptional()
    @IsEnum(LeadSyncStatus)
    status?: LeadSyncStatus;

    @IsOptional()
    @IsEnum(LeadSyncChainProvider)
    provider: LeadSyncChainProvider;

    @IsOptional()
    @IsString()
    crmField?: string;

    @IsOptional()
    @IsString()
    facebookField?: string;
}