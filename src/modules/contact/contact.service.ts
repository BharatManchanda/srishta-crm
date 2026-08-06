import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactFilterDto } from './dto/contact-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { ContactFilterBuilder } from './contact-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { UpdateViewSettingDto } from './dto/contact-view-setting.dto';
import { ContactCreateDto } from './dto/contact-create.dto';
import { ContactUpdateDto } from './dto/contact-update.dto';
import { ActivityEntity, AiEntityType, WhatsappEntityType } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { AiService } from '../ai/ai.service';
import { contactToDocument } from 'src/common/helpers/build-document';
import { NotificationService } from '../notification/notification.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly contactFilterBuilder: ContactFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
    private readonly activityService: ActivityService,
    private readonly aiService: AiService,
    private readonly notificationService: NotificationService,
    private readonly whatsappService: WhatsappService,
  ) { }

  async getList(dto: ContactFilterDto, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { accessLevel: true },
    });

    const where: any = {
      ...this.contactFilterBuilder.build(dto),
      id: {
        in: dto.id !== undefined && dto.id ? [dto?.id] : undefined,
      },
    };

    if (user?.accessLevel === 'STANDARD') {
      where.ownerId = currentUserId;
    } else {
      const userIds = await this.userHierarchyService.getFamilyUserIds(currentUserId);
      where.OR = [
        { createdById: { in: userIds } },
        { ownerId: { in: userIds } }
      ];
    }

    const orderBy = dto.sortBy
      ? { [dto.sortBy]: dto.sortOrder || 'desc' }
      : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.contact, {
      page: dto.page,
      perPage: dto.perPage,
      where,
      include: {
        mailingAddress: true,
        otherAddress: true,
        createdBy: true,
      },
      orderBy,
    });

    const contactIds = result.data.map((contact: any) => contact.id);
    if (contactIds.length > 0) {
      const [tasks, calls, meetings] = await Promise.all([
        this.prisma.task.findMany({
          where: {
            entityType: 'CONTACT',
            entityId: { in: contactIds },
            status: { not: 'COMPLETED' },
          },
        }),
        this.prisma.call.findMany({
          where: {
            entityType: 'CONTACT',
            entityId: { in: contactIds },
            status: { not: 'COMPLETED' },
          },
        }),
        this.prisma.meeting.findMany({
          where: {
            entityType: 'CONTACT',
            entityId: { in: contactIds },
            endTime: { gte: new Date() },
          },
        }),
      ]);

      result.data = result.data.map((contact: any) => {
        const contactTasks = tasks.filter((t) => t.entityId === contact.id);
        const contactCalls = calls.filter((c) => c.entityId === contact.id);
        const contactMeetings = meetings.filter((m) => m.entityId === contact.id);

        return {
          ...contact,
          openActivities: {
            tasks: contactTasks,
            calls: contactCalls,
            meetings: contactMeetings,
          },
        };
      });
    }

    return result;
  }
  async viewSetting(authUserId: number) {
    const contactModule = await this.prisma.module.findFirst({
      where: {
        path: '/contacts',
      },
    });
    if (!contactModule) return;
    const viewSetting = await this.prisma.userTableView.findFirst({
      where: {
        userId: authUserId,
        isDefault: true,
        moduleId: contactModule.id,
      },
      include: {
        columns: true,
      },
    });

    if (!viewSetting) {
      await this.createDefaultContactView(authUserId);
      return this.prisma.userTableView.findFirst({
        where: {
          userId: authUserId,
          isDefault: true,
          moduleId: contactModule.id,
        },
        include: {
          columns: true,
        },
      });
    }

    const hasOpenActivity = viewSetting.columns.some(col => col.field === 'openActivity');
    if (!hasOpenActivity) {
      const nextOrder = Math.max(...viewSetting.columns.map(col => col.order), 0) + 1;
      const newColumn = await this.prisma.tableColumn.create({
        data: {
          tableViewId: viewSetting.id,
          field: 'openActivity',
          label: 'Open Activity',
          visible: true,
          order: nextOrder,
        },
      });
      viewSetting.columns.push(newColumn);
    }

    return viewSetting;
  }

  async updateSetting(dto: UpdateViewSettingDto, authUserId: number) {
    const updatedColumns = await this.prisma.$transaction(
      dto.columns.map((column) =>
        this.prisma.tableColumn.update({
          where: {
            id: column.id,
          },
          data: {
            visible: column.visible,
            ...(column.order !== undefined ? { order: column.order } : {}),
          },
        }),
      ),
    );

    return updatedColumns;
  }

  async createDefaultContactView(userId: number) {
    const contactModule = await this.prisma.module.findUnique({
      where: {
        path: '/contacts',
      },
    });
    if (!contactModule) return;
    await this.prisma.userTableView.create({
      data: {
        userId: userId,
        moduleId: contactModule.id,
        name: 'Default',
        isDefault: true,
        columns: {
          create: [
            { field: 'id', label: 'ID', visible: true, order: 1 },
            { field: 'openActivity', label: 'Open Activity', visible: true, order: 2 },
            { field: 'createdById', label: 'Created By', visible: false, order: 3 },
            { field: 'name', label: 'Name', visible: true, order: 4 },
            { field: 'title', label: 'Title', visible: true, order: 5 },
            { field: 'email', label: 'Email', visible: true, order: 6 },
            { field: 'phone', label: 'Phone', visible: true, order: 7 },
            { field: 'source', label: 'Source', visible: false, order: 8 },
            { field: 'fax', label: 'Fax', visible: false, order: 9 },
            { field: 'assistant', label: 'Assistant', visible: false, order: 10, },
            { field: 'assistantPhone', label: 'Assistant Phone', visible: false, order: 11, },
            { field: 'department', label: 'Department', visible: true, order: 12, },
            { field: 'dateOfBirth', label: 'Date Of Birth', visible: false, order: 13, },
            { field: 'skypeId', label: 'Skype ID', visible: false, order: 14 },
            { field: 'twitter', label: 'Twitter', visible: false, order: 15 },
            { field: 'mailingAddress.country', label: 'Mailing Country', visible: false, order: 16, },
            { field: 'mailingAddress.city', label: 'Mailing City', visible: true, order: 17, },
            { field: 'mailingAddress.stateProvince', label: 'Mailing State', visible: false, order: 18, },
            { field: 'mailingAddress.postalCode', label: 'Mailing Postal Code', visible: false, order: 19, },
            { field: 'mailingAddress.streetAddress', label: 'Mailing Address', visible: false, order: 20, },
            { field: 'otherAddress.country', label: 'Other Country', visible: false, order: 21, },
            { field: 'otherAddress.city', label: 'Other City', visible: false, order: 22, },
            { field: 'otherAddress.stateProvince', label: 'Other State', visible: false, order: 23, },
            { field: 'otherAddress.postalCode', label: 'Other Postal Code', visible: false, order: 24, },
            { field: 'otherAddress.streetAddress', label: 'Other Address', visible: false, order: 25, },
            { field: 'description', label: 'Description', visible: false, order: 26, },
            { field: 'createdAt', label: 'Created At', visible: false, order: 27, },
            { field: 'updatedAt', label: 'Updated At', visible: false, order: 28, },
            { field: 'action', label: 'Action', visible: true, order: 29 },
          ],
        },
      },
    });
  }
  async get(id: number) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: id,
      },
      include: {
        otherAddress: true,
        mailingAddress: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const [notes, attachments, tasks, calls, meetings, emails] = await Promise.all([
      this.prisma.note.count({ where: { entityType: 'CONTACT', entityId: id } }),
      this.prisma.attachment.count({ where: { entityType: 'CONTACT', entityId: id } }),
      this.prisma.task.count({ where: { entityType: 'CONTACT', entityId: id } }),
      this.prisma.call.count({ where: { entityType: 'CONTACT', entityId: id } }),
      this.prisma.meeting.count({ where: { entityType: 'CONTACT', entityId: id } }),
      this.prisma.email.count({ where: { entityType: 'CONTACT', entityId: id } }),
    ]);

    return {
      ...contact,
      counts: {
        notes,
        attachments,
        tasks,
        calls,
        meetings,
        emails,
      },
    };
  }

  async create(dto: ContactCreateDto, authUserId: number) {
    try {
      const { mailingAddress, otherAddress, ...contactData } = dto;

      const [mailAddressRecord, otherAddressRecord] = await Promise.all([
        mailingAddress ? this.prisma.address.create({ data: mailingAddress }) : null,
        otherAddress ? this.prisma.address.create({ data: otherAddress }) : null,
      ]);

      const contact = await this.prisma.contact.create({
        data: {
          ...contactData,
          createdById: authUserId,
          ownerId: dto.ownerId || authUserId,
          mailingAddressId: mailAddressRecord?.id,
          otherAddressId: otherAddressRecord?.id,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        },
        include: {
          owner: true,
        },
      });

      await this.activityService.create({
        entityType: ActivityEntity.CONTACT,
        entityId: contact.id,
        action: 'CONTACT_CREATED',
        description: `Contact "${contact.name}" created.`,
        metadata: {
          name: contact.name,
          email: contact.email,
          title: contact.title,
        },
      }, authUserId);

      await this.aiService.create({
        entityType: AiEntityType.CONTACT,
        entityId: contact.id,
        title: contact.title ?? "",
        content: contactToDocument(contact),
      }, authUserId);

      if (contact.ownerId && contact.ownerId !== authUserId) {
        await this.notificationService.create({
          title: 'Contact Assigned',
          message: `Contact "${contact.name}" has been assigned to you.`,
          type: 'CONTACT',
          module: 'CONTACT',
          entityId: contact.id,
          createdBy: authUserId,
          userIds: [contact.ownerId],
        });
      }

      if (contact.owner && contact.owner.phone) {
        await this.whatsappService.sendMessage({
          message: `Contact "${contact.name}" has been assigned to you.`,
          entityType: WhatsappEntityType.CONTACT,
          entityId: contact.id,
          to: contact.owner.phone
        }, authUserId)
      }

      return contact;
    } catch (error) {
    }
  }

  async update(dto: ContactUpdateDto, id: number, authUserId: number) {
    try {
      const { mailingAddress, otherAddress, ...contactData } = dto;
      const existingContact = await this.prisma.contact.findUnique({
        where: { id },
        include: { mailingAddress: true, otherAddress: true, owner: true },
      });

      if (!existingContact) {
        throw new NotFoundException('Contact not found');
      }

      // Update or create mailing address
      let mailingAddressId = existingContact.mailingAddressId;
      if (mailingAddress) {
        if (mailingAddressId) {
          await this.prisma.address.update({
            where: { id: mailingAddressId },
            data: mailingAddress,
          });
        } else {
          const newAddress = await this.prisma.address.create({
            data: mailingAddress,
          });
          mailingAddressId = newAddress.id;
        }
      }

      // Update or create other address
      let otherAddressId = existingContact.otherAddressId;
      if (otherAddress) {
        if (otherAddressId) {
          await this.prisma.address.update({
            where: { id: otherAddressId },
            data: otherAddress,
          });
        } else {
          const newAddress = await this.prisma.address.create({
            data: otherAddress,
          });
          otherAddressId = newAddress.id;
        }
      }

      const contact = await this.prisma.contact.update({
        where: { id },
        data: {
          ...contactData,
          mailingAddressId,
          otherAddressId,
          dateOfBirth: dto.dateOfBirth !== undefined ? (dto.dateOfBirth ? new Date(dto.dateOfBirth) : null) : undefined,
        },
        include: {
          owner: true,
        },
      });

      await this.activityService.create({
        entityType: ActivityEntity.CONTACT,
        entityId: contact.id,
        action: 'CONTACT_UPDATED',
        description: `Contact "${contact.name}" updated.`,
        metadata: {
          before: existingContact,
          after: contact,
        },
      }, authUserId);

      await this.aiService.update({
        entityId: contact.id,
        entityType: ActivityEntity.CONTACT,
        title: contact.title ?? "",
        content: contactToDocument(contact),
      }, authUserId);

      if (contact.ownerId && existingContact && existingContact.ownerId !== contact.ownerId) {
        await this.notificationService.create({
          title: 'Contact Reassigned',
          message: `Contact "${contact.name}" has been reassigned to you.`,
          type: 'CONTACT',
          module: 'CONTACT',
          entityId: contact.id,
          createdBy: authUserId,
          userIds: [contact.ownerId],
        });

        if (contact.owner && contact.owner.phone) {
          await this.whatsappService.sendMessage({
            message: `Contact "${contact.name}" has been reassigned to you.`,
            entityType: WhatsappEntityType.CONTACT,
            entityId: contact.id,
            to: contact.owner.phone
          }, authUserId)
        }
      }

      return contact;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: number, authUserId: number) {
    const contact = await this.prisma.contact.delete({
      where: {
        id: id,
      },
    });

    await this.activityService.create({
      entityType: ActivityEntity.CONTACT,
      entityId: contact.id,
      action: 'CONTACT_DELETED',
      description: `Contact "${contact.name}" deleted.`,
      metadata: {
        name: contact.name,
        email: contact.email,
      },
    }, authUserId);

    return contact;
  }

  async bulkDelete(ids: number[], authUserId: number) {
    const deletedContacts: any[] = [];
    for (const id of ids) {
      const deleted = await this.delete(id, authUserId);
      deletedContacts.push(deleted);
    }
    return deletedContacts;
  }

  async bulkUpdate(ids: number[], data: any, authUserId: number) {
    const whitelistedKeys = [
      'source',
      'department',
      'assistant',
      'assistantPhone',
      'description',
    ];

    const cleanData = {};
    for (const key of Object.keys(data)) {
      if (whitelistedKeys.includes(key)) {
        cleanData[key] = data[key];
      }
    }

    const updatedContacts: any[] = [];
    for (const id of ids) {
      const updated = await this.update(cleanData as any, id, authUserId);
      updatedContacts.push(updated);
    }
    return updatedContacts;
  }
}

