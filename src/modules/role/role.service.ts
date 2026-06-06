import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoleService {
    constructor(private readonly prisma : PrismaService) {}
    async getList(authUserId: number) {
        return await this.prisma.role.findMany({
            where: {
                createdById: authUserId
            },
        });
    }
}
