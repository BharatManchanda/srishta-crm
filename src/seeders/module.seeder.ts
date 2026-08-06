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
export const CALL_MODULE_ID = 23;
export const MEETING_MODULE_ID = 24;
export const IMPORT_MODULE_ID = 25;
export const EMAIL_MODULE_ID = 26;
export const WHATSAPP_MODULE_ID = 27;
export const GOOGLE_MODULE_ID = 28;
export const LINKEDIN_MODULE_ID = 29;
export const GOOGLE_ADS_MODULE_ID = 30;
export const FACEBOOK_AND_INSTAGRAM_ADS_MODULE_ID = 31;
export const ROLE_CONFIG_MODULE_ID = 32;

const crud = ["View", "Create", "Edit", "Delete"];

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
    availableActions: ["View"],
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
    availableActions: crud,
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
    availableActions: crud,
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
    availableActions: crud,
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
    availableActions: crud,
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
    availableActions: crud,
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
    availableActions: crud,
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
    sort_order: 8,
    availableActions: crud,
    activeOn: [
      '/tasks',
      '/tasks/:id',
      '/tasks/:id/edit',
      '/tasks/create',
    ],
    showInNavbar: true,
  },
  {
    id: CALL_MODULE_ID,
    name: 'Calls',
    path: '/calls',
    icon: 'PhoneCall',
    description: 'Task management',
    parent_id: null,
    sort_order: 9,
    availableActions: crud,
    activeOn: [
      '/calls',
      '/calls/:id',
      '/calls/:id/edit',
      '/calls/create',
    ],
    showInNavbar: true,
  },
  {
    id: MEETING_MODULE_ID,
    name: 'Meeting',
    path: '/meetings',
    icon: 'Handshake',
    description: 'Meeting management',
    parent_id: null,
    sort_order: 10,
    availableActions: crud,
    activeOn: [
      '/meetings',
      '/meetings/:id',
      '/meetings/:id/edit',
      '/meetings/create',
    ],
    showInNavbar: true,
  },
  {
    id: IMPORT_MODULE_ID,
    name: 'Imports',
    path: '/imports',
    icon: 'GridIcon',
    description: 'Bulk import management',
    parent_id: null,
    sort_order: 11,
    availableActions: ["Leads", "Contacts", "Accounts"],
    activeOn: ['/imports', '/imports/:id'],
    showInNavbar: true,
  },
  {
    id: EMAIL_MODULE_ID,
    name: 'Emails',
    path: '/emails',
    icon: 'Mail',
    description: 'Email log management',
    parent_id: null,
    sort_order: 12,
    availableActions: crud,
    activeOn: ['/emails'],
    showInNavbar: true,
  },
  {
    id: WHATSAPP_MODULE_ID,
    name: 'Whatsapp',
    path: '/whatsapp',
    icon: 'MessageCircleMore',
    description: 'Whatsapp chat management',
    parent_id: null,
    sort_order: 13,
    availableActions: ["Whatsapp Access"],
    activeOn: ['/whatsapp'],
    showInNavbar: false,
  },
  {
    id: GOOGLE_MODULE_ID,
    name: 'Google',
    path: '/google',
    icon: 'MessageCircleMore',
    description: 'Google chat management',
    parent_id: null,
    sort_order: 14,
    activeOn: ['/google'],
    showInNavbar: false,
    availableActions: ["Google Ads", "Google Calendar"],
  },
  {
    id: LINKEDIN_MODULE_ID,
    name: 'Linkedin',
    path: '/linkedin',
    icon: 'MessageCircleMore',
    description: 'Linkedin chat management',
    parent_id: null,
    sort_order: 15,
    activeOn: ['/linkedin'],
    showInNavbar: false,
    availableActions: ["Linkedin Ads"],
  },
  {
    id: FACEBOOK_AND_INSTAGRAM_ADS_MODULE_ID,
    name: 'Facebook & Instagram',
    path: '/facebook-and-instagram',
    icon: 'MessageCircleMore',
    description: 'Facebook & Instagram chat management',
    parent_id: null,
    sort_order: 16,
    activeOn: ['/facebook-and-instagram'],
    showInNavbar: false,
    availableActions: ["Facebook & Instagram Ads"],
  },
  {
    id: ROLE_CONFIG_MODULE_ID,
    name: 'Role Configs',
    path: '/role-configs',
    icon: 'MessageCircleMore',
    description: 'Role Configs management',
    parent_id: null,
    sort_order: 16,
    activeOn: ['/role-configs'],
    showInNavbar: false,
    availableActions: ["Facebook & Instagram Ads"],
  },
  {
    id: SETTINGS_MODULE_ID,
    name: 'Settings',
    path: '/settings',
    icon: 'PieChartIcon',
    description: 'Application settings',
    parent_id: null,
    sort_order: 17,
    activeOn: [
      '/settings',
      '/role-configs',
      '/role-configs/:id/edit',
      "/connects",
      "/calendar",
      "/whatsapp",
      "/facebook/lead-sync-chains",
      "/facebook/lead-sync-chains/create",
      "/google-ads/lead-sync-chains",
      "/google-ads/lead-sync-chains/create",
      "/linkedin-ads/lead-sync-chains",
      "/linkedin-ads/lead-sync-chains/create"
    ],
    availableActions: [],
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
        availableActions: module.availableActions,
      },
      create: module,
    });
  }
}
