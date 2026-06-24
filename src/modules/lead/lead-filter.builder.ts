import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { LeadFilterDto } from './dto/lead-filter.dto';

@Injectable()
export class LeadFilterBuilder {
    constructor() { }

    build(dto: LeadFilterDto) {
        return {
            id: dto.id ? Number(dto.id) : undefined,
            name: PrismaFilter.contains(dto.name),
            email: PrismaFilter.contains(dto.email),
            city: PrismaFilter.contains(dto.city),
            status: dto.status,
        };
    }
}