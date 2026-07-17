import { TaskEntityType, PriorityType, TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDate, IsArray } from 'class-validator';

export class BulkTaskCreateDto {
  @IsEnum(TaskEntityType)
  entityType: TaskEntityType;

  @IsArray()
  @IsInt({ each: true })
  entityIds: number[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsEnum(PriorityType)
  priority: PriorityType;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
