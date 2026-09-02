import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([2, 5, 10, 12, 20, 50])
  perPage?: number = 10;


  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false') return false;
    if (value === 'true') return true;
    return value;
  })
  @IsBoolean()
  paginate?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}