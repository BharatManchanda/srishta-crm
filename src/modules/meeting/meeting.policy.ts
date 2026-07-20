import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MEETING_MODULE_ID } from 'src/seeders/module.seeder';

@Injectable()
export class MeetingPolicy {
  constructor(private readonly prisma: PrismaService) {}

  private async hasPermission(
    roleId: number,
    action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
  ) {
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        moduleId: MEETING_MODULE_ID,
        isAllow: true,
        [action]: true,
      },
    });
    return !!permission;
  }

  private async getRootUserId(userId: number): Promise<number> {
    let user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        parentId: true,
      },
    });

    while (user?.parentId) {
      user = await this.prisma.user.findUnique({
        where: {
          id: user.parentId,
        },
        select: {
          id: true,
          parentId: true,
        },
      });
    }
    return user!.id;
  }

  private async getAccessibleUserIds(userId: number): Promise<number[]> {
    const rootId = await this.getRootUserId(userId);

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        parentId: true,
      },
    });

    const allowedIds = [rootId];

    const collectChildren = (parentId: number) => {
      const children = users.filter((u) => u.parentId === parentId);

      for (const child of children) {
        allowedIds.push(child.id);
        collectChildren(child.id);
      }
    };

    collectChildren(rootId);

    return [...new Set(allowedIds)];
  }

  private async canAccessMeeting(currentUser: any, meetingId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { accessLevel: true },
    });

    if (user?.accessLevel === 'STANDARD') {
      const isParticipant = await this.prisma.meetingParticipant.findFirst({
        where: {
          meetingId,
          participantType: 'USER',
          participantId: currentUser.id,
        },
      });
      return !!isParticipant;
    }

    const meeting = await this.prisma.meeting.findUnique({
      where: {
        id: meetingId,
      },
      select: {
        createdById: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const allowedUsers = await this.getAccessibleUserIds(currentUser.id);

    return allowedUsers.includes(meeting.createdById);
  }

  async canViewAll(currentUser: any) {
    return this.hasPermission(currentUser.roleId, 'canView');
  }

  async canView(currentUser: any, meetingId: number) {
    const allowed = await this.hasPermission(currentUser.roleId, 'canView');

    if (!allowed) {
      return false;
    }

    return this.canAccessMeeting(currentUser, meetingId);
  }

  async canCreate(currentUser: any) {
    return this.hasPermission(currentUser.roleId, 'canCreate');
  }

  async canUpdate(currentUser: any, meetingId: number) {
    const allowed = await this.hasPermission(currentUser.roleId, 'canEdit');

    if (!allowed) {
      return false;
    }

    return this.canAccessMeeting(currentUser, meetingId);
  }

  async canDelete(currentUser: any, meetingId: number) {
    const allowed = await this.hasPermission(currentUser.roleId, 'canDelete');

    if (!allowed) {
      return false;
    }

    return this.canAccessMeeting(currentUser, meetingId);
  }

  async authorize(
    currentUser: any,
    action: 'view' | 'viewAll' | 'create' | 'update' | 'delete',
    meetingId?: number,
  ) {
    let allowed = false;

    switch (action) {
      case 'viewAll':
        allowed = await this.canViewAll(currentUser);
        break;

      case 'view':
        allowed = await this.canView(currentUser, meetingId!);
        break;

      case 'create':
        allowed = await this.canCreate(currentUser);
        break;

      case 'update':
        allowed = await this.canUpdate(currentUser, meetingId!);
        break;

      case 'delete':
        allowed = await this.canDelete(currentUser, meetingId!);
        break;
    }

    if (!allowed) {
      throw new ForbiddenException(`You are not allowed to ${action} meeting`);
    }

    return true;
  }
}
