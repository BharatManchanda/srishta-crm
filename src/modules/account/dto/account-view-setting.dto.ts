import { IsArray, IsBoolean, IsInt } from 'class-validator';

class ColumnDto {
  @IsInt()
  id: number;

  @IsBoolean()
  visible: boolean;
}

export class UpdateViewSettingDto {
  @IsArray()
  columns: ColumnDto[];
}
