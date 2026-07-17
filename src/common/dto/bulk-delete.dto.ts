import { IsArray, IsInt } from 'class-validator';

export class BulkDeleteDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}
