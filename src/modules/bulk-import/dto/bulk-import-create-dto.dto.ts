import { ImportEntity } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class BulkImportCreateDto {
    @IsEnum(ImportEntity)
    entity: ImportEntity;

    @IsString()
    @IsNotEmpty()
    fileName: string;

    @IsString()
    @IsNotEmpty()
    mimeType: string;

    @IsString()
    @IsNotEmpty()
    url: string;

    @IsInt()
    size: number;

    @IsString()
    @IsNotEmpty()
    storageKey: string;

    @IsObject()
    columnMapping: Record<string, string>;
}