import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentFilterDto } from './dto/attachment-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { AttachmentFilterBuilder } from './attachment-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { AttachmentCreateDto } from './dto/attachment-create.dto';
import { AttachmentUpdateDto } from './dto/attachment-update.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class AttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly attachmentFilterBuilder: AttachmentFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
    private readonly activityService: ActivityService,
  ) {}

  async getList(dto: AttachmentFilterDto, currentUserId: number) {
    const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };

    const result = await this.paginationService.paginate(this.prisma.attachment, {
      page: dto.page,
      perPage: dto.perPage,
      where: {
        ...this.attachmentFilterBuilder.build(dto),
        createdById: {
          in: await this.userHierarchyService.getFamilyUserIds(currentUserId),
        },
        id: {
          in: dto.id !== undefined && dto.id ? [dto.id] : undefined,
        },
      },
      include: {
        createdBy: true,
      },
      orderBy,
    });
    return result;
  }

  async get(id: number) {
    const attachment = await this.prisma.attachment.findFirst({
      where: {
        id,
      },
      include: {
        createdBy: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async create(dto: AttachmentCreateDto, authUserId: number) {
    const newAttachment = await this.prisma.attachment.create({
      data: {
        ...dto,
        createdById: authUserId,
      },
    });
    await this.activityService.create({
      entityType: dto.entityType as any,
      entityId: dto.entityId,
      action: 'ATTACHMENTS_ADDED',
      description: `Attachment created: "${dto.title}"`,
    }, authUserId);

    return newAttachment;
  }

  async update(dto: AttachmentUpdateDto, id: number, authUserId: number) {
    const oldAttachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!oldAttachment) {
      throw new NotFoundException('Attachment not found');
    }

    const updatedAttachment = await this.prisma.attachment.update({
      where: { id },
      data: dto,
    });

    await this.activityService.create(
      {
        entityType: oldAttachment.entityType as any,
        entityId: oldAttachment.entityId,
        action: 'ATTACHMENTS_EDIT',
        description: `Attachment "${updatedAttachment.title}" updated.`,
        metadata: {
          before: oldAttachment,
          after: updatedAttachment,
        },
      },
      authUserId,
    );

    return updatedAttachment;
  }

  async delete(id: number, authUserId: number) {
    const existingAttachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!existingAttachment) {
      throw new NotFoundException('Attachment not found');
    }

    const deleted = await this.prisma.attachment.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      entityType: existingAttachment.entityType as any,
      entityId: existingAttachment.entityId,
      action: 'ATTACHMENTS_DELETED',
      description: `Attachment deleted: "${existingAttachment.title || existingAttachment.fileName}"`,
    }, authUserId);

    return deleted;
  }
}
