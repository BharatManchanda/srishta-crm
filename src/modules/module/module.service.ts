import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleName, SearchDto } from './dto/search.dto';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { UserPolicy } from '../user/user.policy';

@Injectable()
export class ModuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userHierarchyService: UserHierarchyService,
    private readonly userPolicy: UserPolicy,
  ) {}

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

   async search(dto: SearchDto, currentUser: any) {
    const { q, module } = dto;
    const userIds = await this.userHierarchyService.getFamilyUserIds(
      currentUser.id,
    );

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
        path: true,
      },
    });

    if (module) {
      return {
        modules,
        results: await this.searchModule(module, q, userIds, currentUser),
      };
    }

    const [leads, contacts, accounts, meetings, calls, tasks, users ] = await Promise.all([
      this.searchLead(q, userIds),
      this.searchContact(q, userIds),
      this.searchAccount(q, userIds),
      this.searchMeeting(q, userIds),
      this.searchCall(q, userIds),
      this.searchTask(q, userIds),
      this.searchUser(q, currentUser),
    ]);

    console.log(leads, contacts, accounts, meetings, calls, tasks, users,":::leads, contacts, accounts, meetings, calls, tasks, users")

    return {
      modules,
      results: {
        leads,
        contacts,
        accounts,
        meetings,
        calls,
        tasks,
        users
      },
    };
  }

  private async searchModule(module: ModuleName, q: string, userIds: number[], currentUser: any) {
    switch (module) {
      case ModuleName.LEAD:
        return this.searchLead(q, userIds);

      case ModuleName.USER:
        return this.searchUser(q, currentUser);

      case ModuleName.CONTACT:
        return this.searchContact(q, userIds);

      case ModuleName.ACCOUNT:
        return this.searchAccount(q, userIds);

      case ModuleName.MEETING:
        return this.searchMeeting(q, userIds);

      case ModuleName.CALL:
        return this.searchCall(q, userIds);

      case ModuleName.TASK:
        return this.searchTask(q, userIds);

      // case ModuleName.NOTE:
      //   return this.searchNote(q);

      // case ModuleName.ATTACHMENT:
      //   return this.searchATTACHMENT(q);

      default:
        return [];
    }
  }

  private searchLead(q: string, userIds: number[]) {
    return this.prisma.lead.findMany({
      where: {
        createdById: {
          in: userIds,
        },
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

  private searchContact(q: string, userIds: number[]) {
    return this.prisma.contact.findMany({
      where: {
        createdById: {
          in: userIds,
        },
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

  private searchAccount(q: string, userIds: number[]) {
    return this.prisma.account.findMany({
      where: {
        createdById: {
          in: userIds,
        },
        OR: [
          {accountName: { contains: q, mode: "insensitive" } },
          {accountNumber: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 5,
    });
  }

  private searchMeeting(q: string, userIds: number[]) {
    return this.prisma.meeting.findMany({
      where: {
        createdById: {
          in: userIds,
        },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
  }

  private searchCall(q: string, userIds: number[]) {
    return this.prisma.call.findMany({
      where: {
        createdById: {
          in: userIds,
        },
        OR: [
          { subject: { contains: q, mode: "insensitive" } },
          { agenda: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
  }

  private async searchUser (q: string, currentUser:any) {
    const accessibleUserIds = await this.userPolicy.getAccessibleUserIds(currentUser.id);
    return await this.prisma.user.findMany({
      where: {
        id: {
          in: accessibleUserIds,
        },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
  }

  private searchTask (q: string, userIds: number[]) {
    return this.prisma.task.findMany({
      where: {
        createdById: {
          in: userIds,
        },
        OR: [
          { subject: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
  }
}
