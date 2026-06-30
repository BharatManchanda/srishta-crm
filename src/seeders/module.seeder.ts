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
export const ACCOUNT_MODULE_ID = 18;
export const NOTE_MODULE_ID = 19;
export const ATTACHMENT_MODULE_ID = 20;
export const TASK_MODULE_ID = 22;

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
    showInNavbar: true,
  },
  {
    id: USER_MODULE_ID,
    name: 'Users',
    path: '/user',
    icon: 'UserCircleIcon',
    description: 'User management',
    parent_id: null,
    sort_order: 2,
    activeOn: ['/user', '/user/:id', '/user/:id/edit'],
    showInNavbar: true,
  },
  {
    id: LEAD_MODULE_ID,
    name: 'Leads',
    path: '/leads',
    icon: 'ListIcon',
    description: 'Lead management',
    parent_id: null,
    sort_order: 3,
    activeOn: ['/leads', '/leads/:id', '/leads/:id/edit', '/leads/create'],
    showInNavbar: true,
  },
  {
    id: CONTACT_MODULE_ID,
    name: 'Contact',
    path: '/contacts',
    icon: 'Contact',
    description: 'Contact management',
    parent_id: null,
    sort_order: 4,
    activeOn: [
      '/contacts',
      '/contacts/:id',
      '/contacts/:id/edit',
      '/contacts/create',
    ],
    showInNavbar: true,
  },
  {
    id: NOTE_MODULE_ID,
    name: 'Note',
    path: '/notes',
    icon: 'NotebookPen',
    description: 'Notes management',
    parent_id: null,
    sort_order: 5,
    activeOn: [
      '/notes',
      '/notes/:id',
      '/notes/:id/edit',
      '/notes/create',
    ],
    showInNavbar: false,
  },
  {
    id: ATTACHMENT_MODULE_ID,
    name: 'Attachment',
    path: '/attachments',
    icon: 'Paperclip',
    description: 'Attachments management',
    parent_id: null,
    sort_order: 6,
    activeOn: [
      '/attachments',
      '/attachments/:id',
      '/attachments/:id/edit',
      '/attachments/create',
    ],
    showInNavbar: false,
  },
  {
    id: ACCOUNT_MODULE_ID,
    name: 'Accounts',
    path: '/accounts',
    icon: 'BookUser',
    description: 'Account management',
    parent_id: null,
    sort_order: 7,
    activeOn: [
      '/accounts',
      '/accounts/:id',
      '/accounts/:id/edit',
      '/accounts/create',
    ],
    showInNavbar: true,
  },
  {
    id: TASK_MODULE_ID,
    name: 'Tasks',
    path: '/tasks',
    icon: 'LayersMinus',
    description: 'Task management',
    parent_id: null,
    sort_order: 7,
    activeOn: [
      '/tasks',
      '/tasks/:id',
      '/tasks/:id/edit',
      '/tasks/create',
    ],
    showInNavbar: true,
  },
  {
    id: SETTINGS_MODULE_ID,
    name: 'Settings',
    path: '/settings',
    icon: 'PieChartIcon',
    description: 'Application settings',
    parent_id: null,
    sort_order: 8,
    activeOn: ['/settings', '/role-configs', '/role-configs/:id/edit'],
    showInNavbar: true,
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
        showInNavbar: module.showInNavbar,
      },
      create: module,
    });
  }
}