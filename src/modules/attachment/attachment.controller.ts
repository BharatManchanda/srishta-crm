import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StorageService } from 'src/common/storage/storage.service';
import { AttachmentCreateDto } from './dto/attachment-create.dto';
import { AttachmentUploadUrlDto } from './dto/attachment-upload-url.dto';
import { AttachmentUpdateDto } from './dto/attachment-update.dto';
import { AttachmentFilterDto } from './dto/attachment-filter.dto';
import { AttachmentService } from './attachment.service';
import { AttachmentPolicy } from './attachment.policy';

@UseGuards(AuthGuard)
@Controller('attachment')
export class AttachmentController {
  constructor(
    private readonly storage: StorageService,
    private readonly attachmentService: AttachmentService,
    private readonly attachmentPolicy: AttachmentPolicy,
  ) {}

  @Post('upload-url')
  async uploadUrl(@Body() dto: AttachmentUploadUrlDto) {
    return this.storage.createUploadUrl("attachments", dto.fileName, dto.mimeType);
  }

  @Get()
  async getList(@Query() dto: AttachmentFilterDto, @Req() req: Request) {
    await this.attachmentPolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    return this.attachmentService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: AttachmentCreateDto, @Req() req: Request) {
    await this.attachmentPolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.attachmentService.create(dto, authUserId);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.attachmentPolicy.authorize(req['user'], 'view', id);
    return this.attachmentService.get(id);
  }

  @Get(':id/download-url')
  async getDownloadUrl(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.attachmentPolicy.authorize(req['user'], 'view', id);
    const attachment = await this.attachmentService.get(id);

    const storageKey = attachment.storageKey || this.storage.getKeyFromPublicUrl(attachment.url ?? undefined);

    if (attachment.type !== 'FILE' || !storageKey) {
      throw new BadRequestException('A stored file is required to create a download URL');
    }

    return {
      downloadUrl: await this.storage.createDownloadUrl(
        storageKey,
        attachment.originalName || attachment.fileName || undefined,
      ),
    };
  }

  @Put(':id')
  async update(
    @Body() dto: AttachmentUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.attachmentPolicy.authorize(req['user'], 'update', id);
    const authUserId = req['user'].id
    return this.attachmentService.update(dto, id, authUserId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.attachmentPolicy.authorize(req['user'], 'delete', id);
    const authUserId = req['user'].id;
    return this.attachmentService.delete(id, authUserId);
  }
}
