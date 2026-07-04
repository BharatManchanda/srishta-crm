import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { StorageService } from 'src/common/storage/storage.service';
import { UploadUrlDto } from './dto/upload-url-dto.dto';
import { BulkImportCreateDto } from './dto/bulk-import-create-dto.dto';
import { BulkImportService } from './bulk-import.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('bulk-import')
export class BulkImportController {
    constructor(
        private readonly storage: StorageService,
        private readonly bulkImportService: BulkImportService,
    ) { }

    @Post('upload-url')
    async uploadUrl(@Body() dto: UploadUrlDto) {
        return this.storage.createUploadUrl("bulk-import", dto.fileName, dto.mimeType);
    }

    @Post()
    async create(@Body() dto: BulkImportCreateDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.bulkImportService.create(dto, authUserId);
    }
}
