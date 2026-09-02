import { ActivityEntity } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsIn,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class ActivityFilterDto extends PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    id?: number;
    
    @IsOptional()
    @IsEnum(ActivityEntity)
    entityType?: ActivityEntity;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    entityId?: number;

    @IsOptional()
    @IsString()
    action?: string;

    @IsOptional()
    @IsString()
    description?: string;
}