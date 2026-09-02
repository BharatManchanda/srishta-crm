import { DealLeadSource, DealStage, DealType, } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsIn, IsNumber, IsInt, } from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class BlogsFilterDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;
  
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  updatedAt?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false') return false;
    if (value === 'true') return true;
    return value;
  })
  @IsEnum([true, false])
  isFeatured?: boolean;

}