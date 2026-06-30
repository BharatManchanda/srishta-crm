import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentFilterDto } from './dto/attachment-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { AttachmentFilterBuilder } from './attachment-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { AttachmentCreateDto } from './dto/attachment-create.dto';
import { AttachmentUpdateDto } from './dto/attachment-update.dto';

@Injectable()
export class AttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly attachmentFilterBuilder: AttachmentFilterBuilder,
    private readonly userHierarchyService: UserHierarchyService,
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
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async create(dto: AttachmentCreateDto, authUserId: number) {
    return await this.prisma.attachment.create({
      data: {
        ...dto,
        createdById: authUserId,
      },
    });
  }

  async update(dto: AttachmentUpdateDto, id: number) {
    const existingAttachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!existingAttachment) {
      throw new NotFoundException('Attachment not found');
    }

    return await this.prisma.attachment.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number) {
    const existingAttachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!existingAttachment) {
      throw new NotFoundException('Attachment not found');
    }

    return await this.prisma.attachment.delete({
      where: {
        id,
      },
    });
  }
}
