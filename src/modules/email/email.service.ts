import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, InternalServerErrorException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey || apiKey === 'YOUR_RESEND_API_KEY' || apiKey.trim() === '') {
      console.log(`[Email MOCK] Sending email to: ${to}`);
      console.log(`[Email MOCK] Subject: ${subject}`);
      console.log(`[Email MOCK] Body: ${html}`);
      return;
    }
    const { error } = await this.resend.emails.send({
      from: this.configService.get<string>('MAIL_FROM')!,
      to,
      subject,
      html,
    });

    if (error) {
      switch (error.statusCode) {
        case 400:
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);

        case 401:
          throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);

        case 403:
          throw new HttpException(error.message, HttpStatus.FORBIDDEN);

        case 429:
          throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);

        default:
          throw new HttpException(`Email service unavailable: ${error.message}`, HttpStatus.SERVICE_UNAVAILABLE);
      }
    }
  }

  async createDefaultEmailView(userId: number) {
    const emailModule = await this.prisma.module.findFirst({
      where: {
        path: '/emails',
      },
    });
    if (!emailModule) return;
    await this.prisma.userTableView.create({
      data: {
        userId: userId,
        moduleId: emailModule.id,
        name: 'Default',
        isDefault: true,
        columns: {
          create: [
            { field: 'id', label: 'ID', visible: true, order: 1 },
            { field: 'recipientEmail', label: 'Recipient Email', visible: true, order: 2 },
            { field: 'subject', label: 'Subject', visible: true, order: 3 },
            { field: 'content', label: 'Content', visible: false, order: 4 },
            { field: 'status', label: 'Status', visible: true, order: 5 },
            { field: 'entityType', label: 'Related To Module', visible: false, order: 6 },
            { field: 'entityId', label: 'Related To ID', visible: false, order: 7 },
            { field: 'createdAt', label: 'Created At', visible: true, order: 8 },
            { field: 'action', label: 'Action', visible: true, order: 9 },
          ],
        },
      },
    });
  }

  async viewSetting(authUserId: number) {
    const emailModule = await this.prisma.module.findFirst({
      where: {
        path: '/emails',
      },
    });
    if (!emailModule) return;
    const viewSetting = await this.prisma.userTableView.findFirst({
      where: {
        userId: authUserId,
        isDefault: true,
        moduleId: emailModule.id,
      },
      include: {
        columns: true,
      },
    });

    if (!viewSetting) {
      await this.createDefaultEmailView(authUserId);
      return this.prisma.userTableView.findFirst({
        where: {
          userId: authUserId,
          isDefault: true,
          moduleId: emailModule.id,
        },
        include: {
          columns: true,
        },
      });
    }
    return viewSetting;
  }

  async updateSetting(dto: any, authUserId: number) {
    const updatedColumns = await this.prisma.$transaction(
      dto.columns.map((column: any) =>
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
}
