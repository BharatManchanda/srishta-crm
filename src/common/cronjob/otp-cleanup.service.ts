import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class OtpCleanupService {
    private readonly logger = new Logger(OtpCleanupService.name);

    constructor(
        private readonly prisma: PrismaService,
    ) {}

    @Cron(CronExpression.EVERY_5_MINUTES)
    async removeExpiredOtps() {
        const result = await this.prisma.otpVerification.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });

        if (result.count > 0) {
            this.logger.log(`Deleted ${result.count} expired OTPs`);
        }
    }
}