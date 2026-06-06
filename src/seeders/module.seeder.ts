import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const modules = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'GridIcon',
    description: 'Dashboard module',
    parent_id: null,
    sort_order: 1,
  },
  {
    name: 'Users',
    path: '/user',
    icon: 'UserCircleIcon',
    description: 'User management',
    parent_id: null,
    sort_order: 2,
  },
  {
    name: 'Leads',
    path: '/leads',
    icon: 'ListIcon',
    description: 'Lead management',
    parent_id: null,
    sort_order: 3,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: 'PieChartIcon',
    description: 'Application settings',
    parent_id: null,
    sort_order: 4,
  },
];

export default async function seedModules() {
  for (const module of modules) {
    await prisma.module.upsert({
      where: {
        path: module.path,
      },
      update: {
        name: module.name,
        icon: module.icon,
        description: module.description,
        sort_order: module.sort_order,
        parent_id: module.parent_id,
      },
      create: module,
    });

    console.log(`✓ ${module.name}`);
  }

  console.log('Modules seeded successfully');
}