import 'dotenv/config';

import {
  PrismaClient,
  Prisma,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export default async function seedRolePermissions() {
  try {
    const [roles, modules] = await Promise.all([
      prisma.role.findMany({
        select: {
          id: true,
          name: true,
          users: {
            where: {
              isSuperAdmin: true,
            },
            select: {
              id: true,
            },
          },
        },
      }),

      prisma.module.findMany({
        select: {
          id: true,
        },
      }),
    ]);

    const rows: Prisma.RolePermissionCreateManyInput[] = [];

    for (const role of roles) {
      const isSuperAdmin = role.users.length > 0;

      for (const module of modules) {
        rows.push({
          roleId: role.id,
          moduleId: module.id,

          isAllow: isSuperAdmin,
          canView: isSuperAdmin,
          canCreate: isSuperAdmin,
          canEdit: isSuperAdmin,
          canDelete: isSuperAdmin,
        });
      }
    }

    const result = await prisma.rolePermission.createMany({
      data: rows,
      skipDuplicates: true,
    });
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}