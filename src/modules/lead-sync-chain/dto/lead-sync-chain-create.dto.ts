import { 
    IsEnum,
    IsString,
    IsInt,
    IsObject
} from "class-validator";
import { Type } from "class-transformer";


export enum LeadSyncModule {
    LEAD = "LEAD",
    CONTACT = "CONTACT"
}


export class LeadSyncChainCreateDto {
    @Type(() => Number)
    @IsInt()
    facebookAccountId: number;

    @IsString()
    ad: string;

    @IsString()
    page: string;

    @IsString()
    form: string;

    @IsEnum(LeadSyncModule)
    module: LeadSyncModule;

    @IsObject()
    mapping: Record<string, string>;
}