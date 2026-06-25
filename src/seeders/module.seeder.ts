import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export const DASHBOARD_MODULE_ID = 13;
export const USER_MODULE_ID = 14;
export const LEAD_MODULE_ID = 15;
export const SETTINGS_MODULE_ID = 16;
export const CONTACT_MODULE_ID = 17;

const modules = [
  {
    id: DASHBOARD_MODULE_ID,
    name: 'Dashboard',
    path: '/dashboard',
    icon: 'GridIcon',
    description: 'Dashboard module',
    parent_id: null,
    sort_order: 1,
    activeOn: ['/dashboard'],
  },
  {
    id: USER_MODULE_ID,
    name: 'Users',
    path: '/user',
    icon: 'UserCircleIcon',
    description: 'User management',
    parent_id: null,
    sort_order: 2,
    activeOn: ['/user', '/user/:id', "/user/:id/edit"],
  },
  {
    id: LEAD_MODULE_ID,
    name: 'Leads',
    path: '/leads',
    icon: 'ListIcon',
    description: 'Lead management',
    parent_id: null,
    sort_order: 3,
    activeOn: ['/leads', '/leads/:id', "/leads/:id/edit", "/leads/create"],
  },
  {
    id: CONTACT_MODULE_ID,
    name: 'Contact',
    path: '/contacts',
    icon: 'Contact',
    description: 'Contact management',
    parent_id: null,
    sort_order: 3,
    activeOn: ['/contacts', '/contacts/:id', "/contacts/:id/edit", "/contacts/create"],
  },
  {
    id: SETTINGS_MODULE_ID,
    name: 'Settings',
    path: '/settings',
    icon: 'PieChartIcon',
    description: 'Application settings',
    parent_id: null,
    sort_order: 4,
    activeOn: ['/settings', '/role-configs', "/role-configs/:id/edit"],
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
        activeOn: module.activeOn,
      },
      create: module,
    });

    console.log(`✓ ${module.name}`);
  }

  console.log('Modules seeded successfully');
}