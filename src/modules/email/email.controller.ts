import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { SendSingleEmailDto } from './dto/send-single-email.dto';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import { ActivityEntity } from '@prisma/client';

@UseGuards(AuthGuard)
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

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
    } else if (dto.entityType === 'ACCOUNT') {
      const account = await this.prisma.account.findUnique({
        where: { id: dto.entityId },
      });
      email = null; // Account has no email field in prisma schema
      entityName = account?.accountName || '';
    }

    if (!email) {
      throw new Error(`Email address not found for the selected ${dto.entityType}.`);
    }

    await this.emailService.sendEmail(email, dto.subject, dto.content);

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
      } else if (dto.entityType === 'ACCOUNT') {
        const account = await this.prisma.account.findUnique({
          where: { id: entityId },
        });
        email = null; // Account has no email field in prisma schema
        entityName = account?.accountName || '';
      }

      if (!email) {
        errors.push(`ID ${entityId}: Email not found.`);
        continue;
      }

      try {
        await this.emailService.sendEmail(email, dto.subject, dto.content);
        sentCount++;

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
