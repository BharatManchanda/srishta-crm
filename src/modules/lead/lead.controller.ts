import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { LeadService } from './lead.service';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { LeadCreateDto } from './dto/lead-create.dto';
import { LeadUpdateDto } from './dto/lead-update.dto';
import { LeadPolicy } from './lead.policy';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { BulkDeleteDto } from '../../common/dto/bulk-delete.dto';
import { BulkUpdateDto } from '../../common/dto/bulk-update.dto';


@UseGuards(AuthGuard)
@Controller('lead')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly leadPolicy: LeadPolicy,
  ) { }

  @Get()
  async getList(@Query() dto: LeadFilterDto, @Req() req: Request) {
    await this.leadPolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    console.log("Leads---")
    return this.leadService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: LeadCreateDto, @Req() req: Request) {
    await this.leadPolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.leadService.create(dto, authUserId);
  }

  @Get('view-setting')
  async viewSetting(@Req() req: Request) {
    const authUserId = req['user'].id;
    return this.leadService.viewSetting(authUserId);
  }

  @Put('update-setting')
  async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    return this.leadService.updateSetting(dto, authUserId);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.leadPolicy.authorize(req['user'], 'view', id);
    const authUserId = req['user'].id;
    return this.leadService.get(id);
  }

  @Put(':id')
  async update(
    @Body() dto: LeadUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.leadPolicy.authorize(req['user'], 'update', id);
    const authUserId = req['user'].id;
    return this.leadService.update(dto, id, authUserId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.leadPolicy.authorize(req['user'], 'delete', id);
    const authUserId = req['user'].id;
    return this.leadService.delete(id, authUserId);
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() dto: BulkDeleteDto, @Req() req: Request) {
    for (const id of dto.ids) {
      await this.leadPolicy.authorize(req['user'], 'delete', id);
    }
    const authUserId = req['user'].id;
    return this.leadService.bulkDelete(dto.ids, authUserId);
  }

  @Post('bulk-update')
  async bulkUpdate(@Body() dto: BulkUpdateDto, @Req() req: Request) {
    for (const id of dto.ids) {
      await this.leadPolicy.authorize(req['user'], 'update', id);
    }
    const authUserId = req['user'].id;
    return this.leadService.bulkUpdate(dto.ids, dto.data, authUserId);
  }
}

