import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { FieldType } from '@prisma/client';

export class ModuleFieldCreateDto {

    @IsInt()
    moduleId: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    label: string;

    @IsEnum(FieldType)
    type: FieldType;

    @IsBoolean()
    @IsOptional()
    required?: boolean = false;

    @IsOptional()
    options?: Record<string, any>;
}

export enum ModuleEnum {
  LEAD = 'LEAD',
  CONTACT = 'CONTACT',
  ACCOUNT = 'ACCOUNT',
  CALL = 'CALL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK',
}