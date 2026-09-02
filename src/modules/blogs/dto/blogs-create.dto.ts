import { BlogStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBlogDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    slug: string;

    @IsString()
    @IsOptional()
    content: string;

    @IsString()
    @IsOptional()
    featuredImage?: string;

    @IsString()
    @IsOptional()
    featuredImageAlt?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    metaTitle?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    metaDescription?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    publishedAt?: Date;

    @Type(() => Number)
    @IsInt()
    categoryId?: number;

    @IsOptional()
    @IsEnum(BlogStatus)
    status?: BlogStatus;

    @IsOptional()
    @IsBoolean()
    
    isFeatured?: boolean;
    
    
}