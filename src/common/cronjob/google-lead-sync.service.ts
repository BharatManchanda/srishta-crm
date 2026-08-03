import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { GoogleAdsService } from "src/modules/google-ads/google-ads.service";
import { PrismaService } from "src/modules/prisma/prisma.service";

@Injectable()
export class GoogleLeadSyncService {
    private readonly logger = new Logger(GoogleLeadSyncService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly googleAdsService: GoogleAdsService
    ) {}

    @Cron(CronExpression.EVERY_SECOND)
    // @Cron(CronExpression.EVERY_MINUTE)
    async sync() {
        const connections = await this.prisma.googleAdsConnection.findMany();
        // this.logger.log("Cron running", connections);

        for (const connection of connections) {
            try {
                // const leads = await this.googleAdsService.getLeads(connection);
                // console.log(leads,"::leads")
            } catch (e) {
                // console.log(e);
            }
        }

        // console.log("Syncing leads");7464584745
    }
}