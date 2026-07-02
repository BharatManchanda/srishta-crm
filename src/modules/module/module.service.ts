import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleName, SearchDto } from './dto/search.dto';

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
        showInNavbar: true,
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

  async globalSearch() {
    
  }

   async search(dto: SearchDto) {
    const { q, module } = dto;

    // Search module names
    const modules = await this.prisma.module.findMany({
      where: {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (module) {
      return {
        modules,
        results: await this.searchModule(module, q),
      };
    }

    const [leads, contacts, accounts, meetings, calls ] = await Promise.all([
      this.searchLead(q),
      this.searchContact(q),
      this.searchAccount(q),
      this.searchMeeting(q),
      this.searchCall(q),
    ]);

    return {
      modules,
      results: {
        leads,
        contacts,
        accounts,
        meetings,
        calls,
      },
    };
  }

  private async searchModule(module: ModuleName, q: string) {
    switch (module) {
      case ModuleName.LEAD:
        return this.searchLead(q);

      case ModuleName.CONTACT:
        return this.searchContact(q);

      case ModuleName.ACCOUNT:
        return this.searchAccount(q);

      case ModuleName.MEETING:
        return this.searchMeeting(q);

      case ModuleName.CALL:
        return this.searchCall(q);

      default:
        return [];
    }
  }

  private searchLead(q: string) {
    return this.prisma.lead.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
  }

  private searchContact(q: string) {
    return this.prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
  }

  private searchAccount(q: string) {
    return this.prisma.account.findMany({
      where: {
        accountName: { contains: q, mode: "insensitive", },
        accountNumber: { contains: q, mode: "insensitive", },
      },
      take: 5,
    });
  }

  private searchMeeting(q: string) {
    return this.prisma.meeting.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
  }

  private searchCall(q: string) {
    return this.prisma.call.findMany({
      where: {
        OR: [
          { subject: { contains: q, mode: "insensitive" } },
          { agenda: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
  }
}
