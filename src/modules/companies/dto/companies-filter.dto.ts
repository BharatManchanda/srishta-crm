import { Transform } from "class-transformer"
import { IsNumber, IsOptional, IsString } from "class-validator"
import { PaginationDto } from "src/common/pagination/dto/pagination.dto"

export class CompaniesFilterDto extends PaginationDto {
    @IsOptional()
    @IsString()
    companyCity?: string

    @IsOptional()
    @IsString()
    companyCountry?: string

    @IsOptional()
    @IsString()
    companyName?: string

    @IsOptional()
    @IsString()
    companyPhone?: string

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) =>
        value !== undefined && value !== '' ? Number(value) : undefined,
      )
    employees?: number;

    @IsOptional()
    @IsString()
    companyEmail?: string

    @IsOptional()
    @IsString()
    name?: string
}