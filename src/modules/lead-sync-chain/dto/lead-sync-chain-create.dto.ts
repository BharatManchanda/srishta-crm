import { 
    IsEnum,
    IsString,
    IsInt,
    IsObject,
    IsOptional
} from "class-validator";
import { Type } from "class-transformer";
import { LeadSyncChainProvider } from "@prisma/client";

export enum LeadSyncModule {
    LEAD = "LEAD",
    CONTACT = "CONTACT"
}


export class LeadSyncChainCreateDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    facebookAccountId?: number;

    @IsOptional()
    @IsString()
    ad?: string;

    @IsOptional()
    @IsString()
    page?: string;
    
    @IsOptional()
    @IsString()
    form?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    googleAdsId?: number;

    @IsOptional()
    @IsString()
    linkedinAccId?: string;

    @IsOptional()
    @IsString()
    linkedinAdsAccId?: string;

    @IsOptional()
    @IsString()
    linkedinFormId?: string;

    @IsEnum(LeadSyncModule)
    module: LeadSyncModule;

    @IsEnum(LeadSyncChainProvider)
    provider: LeadSyncChainProvider;

    @IsObject()
    mapping: Record<string, string>;
}