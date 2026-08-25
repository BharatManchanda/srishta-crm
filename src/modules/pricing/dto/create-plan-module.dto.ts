import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanModuleDto {
    @IsInt()
    @Min(1)
    moduleId: number;

    @IsBoolean()
    enabled: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    limit?: number | null;

    @IsOptional()
    @IsString()
    displayValue?: string | null;

    @IsOptional()
    @IsString()
    featureLabel?: string | null;

    @IsOptional()
    @IsString()
    featureDescription?: string | null;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    actions?: string[];

    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}