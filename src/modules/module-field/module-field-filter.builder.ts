import { Injectable } from '@nestjs/common';
import { ModuleFieldFilterDto } from './dto/module-field-filter.dto';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';


@Injectable()
export class ModuleFieldFilterBuilder {


build(dto: ModuleFieldFilterDto) {
    return {
        moduleId: dto.moduleId ? Number(dto.moduleId) : undefined,

        name: PrismaFilter.contains(dto.name ),

        label: PrismaFilter.contains(dto.label),

        type: dto.type,

        required: dto.required,
    };
}}