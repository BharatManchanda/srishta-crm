import {
    IsArray,
    IsBoolean,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreatePlanModuleDto } from './create-plan-module.dto';

export class CreatePricingPlanDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsOptional()
    @IsString()
    description?: string | null;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    monthlyPrice: number;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    yearlyPrice: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsBoolean()
    popular?: boolean;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    sortOrder: number;

    @IsOptional()
    @IsIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

    @IsOptional()
    @IsString()
    cta?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePlanModuleDto)
    planModules?: CreatePlanModuleDto[];
}