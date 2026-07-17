import { IsArray, IsInt, IsObject } from 'class-validator';

export class BulkUpdateDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];

  @IsObject()
  data: Record<string, any>;
}
