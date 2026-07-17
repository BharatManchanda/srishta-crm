import { TaskEntityType, PriorityType, TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDate } from 'class-validator';

export class TaskCreateDto {
  @IsOptional()
  @IsEnum(TaskEntityType)
  entityType?: TaskEntityType;

  @IsOptional()
  @IsInt()
  entityId?: number;

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
