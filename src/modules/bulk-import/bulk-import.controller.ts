import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { StorageService } from 'src/common/storage/storage.service';
import { UploadUrlDto } from './dto/upload-url-dto.dto';
import { BulkImportCreateDto } from './dto/bulk-import-create-dto.dto';
import { BulkImportService } from './bulk-import.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ImportJobFilterDto } from './dto/import-job-filter.dto';
import { ImportRowFilterDto } from './dto/import-row-filter.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

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

    @Get()
    async getList(@Query() dto: ImportJobFilterDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.bulkImportService.getList(dto, authUserId);
    }

    @Get('rows')
    async getListRows(@Query() dto: ImportRowFilterDto) {
        return this.bulkImportService.getListRows(dto);
    }

    @Get('view-setting')
    async viewSetting(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.bulkImportService.viewSetting(authUserId);
    }

    @Put('update-setting')
    async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.bulkImportService.updateSetting(dto, authUserId);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.bulkImportService.findOne(id);
    }
}
