import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, ValidateNested } from 'class-validator';

class ColumnDto {
  @IsInt()
  id: number;

  @IsBoolean()
  visible: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateViewSettingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnDto)
  columns: ColumnDto[];
}
