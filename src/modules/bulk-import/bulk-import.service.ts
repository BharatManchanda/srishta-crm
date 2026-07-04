import { Injectable } from '@nestjs/common';
import { BulkImportCreateDto } from './dto/bulk-import-create-dto.dto';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ImportStatus } from '@prisma/client';
@Injectable()
export class BulkImportService {
    constructor(
        private readonly prisma: PrismaService,

        @InjectQueue('bulk-import')
        private readonly bulkImportQueue: Queue,
    ) { }

    async create(dto: BulkImportCreateDto, authUserId: number) {
        const importJob = await this.prisma.importJob.create({
            data: {
                ...dto,
                createdById: authUserId,
                status: ImportStatus.PENDING,
            },
        });

        // 2. Add job to queue
        await this.bulkImportQueue.add(`${dto.entity}-import`, // e.g. lead-import
            {
                importJobId: importJob.id,
            },
            {
                attempts: 3,
                removeOnComplete: 100,
                removeOnFail: 100,
            },
        );

        // 3. Return immediately
        return importJob;
    }
}
