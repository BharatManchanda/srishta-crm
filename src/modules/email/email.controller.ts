import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { SendSingleEmailDto } from './dto/send-single-email.dto';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import { EmailFilterDto } from './dto/email-filter.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { ActivityEntity, EmailEntityType } from '@prisma/client';
import { PaginationService } from 'src/common/pagination/pagination.service';

@UseGuards(AuthGuard)
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly paginationService: PaginationService,
  ) {}

  @Get('view-setting')
  async viewSetting(@Req() req: Request) {
    const authUserId = req['user'].id;
    return this.emailService.viewSetting(authUserId);
  }

  @Put('update-setting')
  async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    return this.emailService.updateSetting(dto, authUserId);
  }

  @Get()
  async getEmails(@Query() dto: EmailFilterDto) {
    const orderBy = { id: 'desc' as const };
    const where: any = {
      entityType: dto.entityType || undefined,
      entityId: dto.entityId || undefined,
      status: dto.status || undefined,
    };

    if (dto.search) {
      where.OR = [
        { recipientEmail: { contains: dto.search, mode: 'insensitive' } },
        { subject: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    return await this.paginationService.paginate(this.prisma.email, {
      page: dto.page,
      perPage: dto.perPage,
      paginate: dto?.paginate,
      where,
      orderBy,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  @Post('send-single')
  async sendSingle(@Body() dto: SendSingleEmailDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    let email: string | null = null;
    let entityName = '';

    if (dto.entityType === 'LEAD') {
      const lead = await this.prisma.lead.findUnique({
        where: { id: dto.entityId },
      });
      email = lead?.email || null;
      entityName = lead?.name || '';
    } else if (dto.entityType === 'CONTACT') {
      const contact = await this.prisma.contact.findUnique({
        where: { id: dto.entityId },
      });
      email = contact?.email || null;
      entityName = contact?.name || '';
    }

    if (!email) {
      throw new Error(`Email address not found for the selected ${dto.entityType}.`);
    }

    try {
      await this.emailService.sendEmail(email, dto.subject, dto.content);

      // Store email in database
      await this.prisma.email.create({
        data: {
          entityType: dto.entityType as EmailEntityType,
          entityId: dto.entityId,
          recipientEmail: email,
          subject: dto.subject,
          content: dto.content,
          createdById: authUserId,
          status: 'DELIVERED',
        },
      });

      // Log activity
      await this.activityService.create(
        {
          entityType: dto.entityType as ActivityEntity,
          entityId: dto.entityId,
          action: 'EMAIL_SENT',
          description: `Sent email to ${entityName} (${email}) with subject: "${dto.subject}"`,
          metadata: {
            recipientEmail: email,
            subject: dto.subject,
            content: dto.content,
          },
        },
        authUserId,
      );

      return { success: true };
    } catch (err: any) {
      // Store failed email in database
      await this.prisma.email.create({
        data: {
          entityType: dto.entityType as EmailEntityType,
          entityId: dto.entityId,
          recipientEmail: email,
          subject: dto.subject,
          content: dto.content,
          createdById: authUserId,
          status: 'FAILED',
        },
      }).catch(console.error);

      throw err;
    }
  }

  @Post('send-bulk')
  async sendBulk(@Body() dto: SendBulkEmailDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    const errors: string[] = [];
    let sentCount = 0;

    for (const entityId of dto.entityIds) {
      let email: string | null = null;
      let entityName = '';

      if (dto.entityType === 'LEAD') {
        const lead = await this.prisma.lead.findUnique({
          where: { id: entityId },
        });
        email = lead?.email || null;
        entityName = lead?.name || '';
      } else if (dto.entityType === 'CONTACT') {
        const contact = await this.prisma.contact.findUnique({
          where: { id: entityId },
        });
        email = contact?.email || null;
        entityName = contact?.name || '';
      }

      if (!email) {
        errors.push(`ID ${entityId}: Email not found.`);
        continue;
      }

      try {
        await this.emailService.sendEmail(email, dto.subject, dto.content);
        sentCount++;

        // Store email in database
        await this.prisma.email.create({
          data: {
            entityType: dto.entityType as EmailEntityType,
            entityId: entityId,
            recipientEmail: email,
            subject: dto.subject,
            content: dto.content,
            createdById: authUserId,
            status: 'DELIVERED',
          },
        });

        // Log activity
        await this.activityService.create(
          {
            entityType: dto.entityType as ActivityEntity,
            entityId: entityId,
            action: 'EMAIL_SENT',
            description: `Sent bulk email to ${entityName} (${email}) with subject: "${dto.subject}"`,
            metadata: {
              recipientEmail: email,
              subject: dto.subject,
              content: dto.content,
            },
          },
          authUserId,
        );
      } catch (err: any) {
        console.error(`Failed to send email to ${email}:`, err);
        errors.push(`ID ${entityId} (${email}): ${err.message || 'Send failed'}`);

        // Store failed email in database
        await this.prisma.email.create({
          data: {
            entityType: dto.entityType as EmailEntityType,
            entityId: entityId,
            recipientEmail: email,
            subject: dto.subject,
            content: dto.content,
            createdById: authUserId,
            status: 'FAILED',
          },
        }).catch(console.error);
      }
    }

    return {
      success: true,
      sentCount,
      totalCount: dto.entityIds.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
