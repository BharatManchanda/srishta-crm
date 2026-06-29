import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModuleService {
  constructor(private readonly prisma: PrismaService) {}
  async getList(currentUser: any) {
    const roleId = currentUser.roleId;
    const permissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
        isAllow: true,
      },
      select: {
        moduleId: true,
      },
    });
    const moduleIds = permissions.map((p) => p.moduleId);
    const modules = await this.prisma.module.findMany({
      orderBy: { sort_order: 'asc' },
      where: {
        id: {
          in: moduleIds,
        },
      },
    });

    const moduleMap = new Map<number, any>();
    modules.forEach((m) => moduleMap.set(m.id, { ...m, subItems: [] }));
    const topLevel: any[] = [];

    modules.forEach((m) => {
      const navItem = {
        id: m.id,
        icon: m.icon,
        name: m.name,
        path: m.path ?? undefined,
        subItems: [],
        activeOn: m.activeOn ?? [],
      };

      if (m.parent_id) {
        const parent = moduleMap.get(m.parent_id);
        if (parent) {
          parent.subItems.push({
            name: m.name,
            path: m.path,
            pro: false,
            activeOn: m.activeOn ?? [],
          });
        }
      } else {
        topLevel.push(navItem);
      }
    });

    topLevel.forEach((item) => {
      const record = moduleMap.get(item.id);

      if (record?.subItems?.length) {
        item.subItems = record.subItems.map((sub: any) => ({
          name: sub.name,
          path: sub.path,
          pro: false,
          activeOn: sub.activeOn ?? [],
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
