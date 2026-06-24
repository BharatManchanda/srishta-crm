import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModuleService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }
    async getList() {
        const modules = await this.prisma.module.findMany({
            orderBy: { sort_order: 'asc' },
        });
        // Build a map of id -> module record
        const moduleMap = new Map<number, any>();
        modules.forEach(m => moduleMap.set(m.id, { ...m, subItems: [] }));
        const topLevel: any[] = [];

        modules.forEach(m => {
            const navItem = {
                id: m.id,
                icon: m.icon,
                name: m.name,
                path: m.path ?? undefined,
                subItems: [],
            };

            if (m.parent_id) {
                const parent = moduleMap.get(m.parent_id);
                if (parent) {
                    parent.subItems.push({
                        name: m.name,
                        path: m.path,
                        pro: false,
                    });
                }
            } else {
                topLevel.push(navItem);
            }
        });

        topLevel.forEach(item => {
            const record = moduleMap.get(item.id);

            if (record?.subItems?.length) {
                item.subItems = record.subItems.map((sub: any) => ({
                    name: sub.name,
                    path: sub.path,
                    pro: false,
                }));
            }
        });
        return topLevel;
    }

    async getStraightList() {
        return this.prisma.module.findMany({
            orderBy: { id: 'desc' },
        });
    }
}
