import { IsArray, IsBoolean, IsInt, IsOptional } from 'class-validator';

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
  columns: ColumnDto[];
}
