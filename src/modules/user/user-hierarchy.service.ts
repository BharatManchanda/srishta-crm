import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserHierarchyService {
	constructor(
		private readonly prisma: PrismaService,
	) {}

  /**
   * Return:
   * - current user
   * - all parents
   * - all children recursively
   */
  async getFamilyUserIds(userId: number): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        parentId: true,
      },
    });

    const result = new Set<number>();

    // parent lookup
    const userMap = new Map(users.map((u) => [u.id, u]));

    // child lookup
    const childMap = new Map<number, number[]>();

    for (const user of users) {
      if (!user.parentId) continue;

      if (!childMap.has(user.parentId)) {
        childMap.set(user.parentId, []);
      }

      childMap.get(user.parentId)!.push(user.id);
    }

    // collect parents
    let current = userMap.get(userId);

    while (current) {
      result.add(current.id);

      if (!current.parentId) {
        break;
      }

      current = userMap.get(current.parentId);
    }

    // collect children
    const collectChildren = (parentId: number) => {
      const children = childMap.get(parentId) || [];

      for (const childId of children) {
        if (result.has(childId)) continue;

        result.add(childId);

        collectChildren(childId);
      }
    };

    collectChildren(userId);

    return [...result];
  }

  async getMainParent(userId: number) {
    let currentUserId = userId;
    while (true) {
      const user = await this.prisma.user.findUnique({
        where: {
          id: currentUserId,
        },
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      });


      if (!user) {
        return null;
      }


      // reached root parent
      if (!user.parentId) {
        return user;
      }


      currentUserId = user.parentId;

    }

  }
}
