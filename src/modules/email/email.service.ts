import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
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
        throw error;
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
