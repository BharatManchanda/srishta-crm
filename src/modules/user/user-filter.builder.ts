import { Injectable } from '@nestjs/common';
import { UserFilterDto } from './dto/user-filter.dto';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';

@Injectable()
export class UserFilterBuilder {
    constructor() { }

    build(dto: UserFilterDto) {

        return {

            // id: dto.id ? dto.id : undefined,

            name: PrismaFilter.contains(dto.name),

            email: PrismaFilter.contains(dto.email),

            roleId: dto.roleId ? Number(dto.roleId) : undefined,

            status: dto.status,
        };
    }
}