import { Module } from '@nestjs/common';
import { GoogleLeadSyncService } from './google-lead-sync.service';
import { GoogleAdsModule } from 'src/modules/google-ads/google-ads.module';
import { PrismaModule } from 'src/modules/prisma/prisma.module';

@Module({
    imports:[GoogleAdsModule, PrismaModule],
    providers:[GoogleLeadSyncService],
})
export class CronjobModule {}