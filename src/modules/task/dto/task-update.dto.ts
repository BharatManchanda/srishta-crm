import { TaskEntityType, PriorityType, TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDate } from 'class-validator';

export class TaskUpdateDto {
  @IsOptional()
  @IsEnum(TaskEntityType)
  entityType?: TaskEntityType;

  @IsOptional()
  @IsInt()
  entityId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subject?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsEnum(PriorityType)
  priority?: PriorityType;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
