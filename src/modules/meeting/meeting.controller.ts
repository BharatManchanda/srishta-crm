import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MeetingService } from './meeting.service';
import { MeetingFilterDto } from './dto/meeting-filter.dto';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';
import { MeetingPolicy } from './meeting.policy';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { BulkDeleteDto } from '../../common/dto/bulk-delete.dto';
import { BulkUpdateDto } from '../../common/dto/bulk-update.dto';
import { ModuleFieldService } from '../module-field/module-field.service';
import { MEETING_MODULE_ID } from 'src/seeders/module.seeder';
import { ModuleEnum } from '../module-field/dto/module-field-create.dto';

@UseGuards(AuthGuard)
@Controller('meeting')
export class MeetingController {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly meetingPolicy: MeetingPolicy,
    private readonly moduleFieldService: ModuleFieldService,
  ) {}

  @Get()
  async getList(@Query() dto: MeetingFilterDto, @Req() req: Request) {
    await this.meetingPolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    await this.moduleFieldService.createDefault(MEETING_MODULE_ID, ModuleEnum.MEETING, authUserId);
    return this.meetingService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: MeetingCreateDto, @Req() req: Request) {
    await this.moduleFieldService.validateRequiredFields(MEETING_MODULE_ID, req['user'].id, dto);
    await this.meetingPolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.meetingService.create(dto, authUserId);
  }

  @Get('view-setting')
  async viewSetting(@Req() req: Request) {
    const authUserId = req['user'].id;
    return this.meetingService.viewSetting(authUserId);
  }

  @Put('update-setting')
  async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    return this.meetingService.updateSetting(dto, authUserId);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.meetingPolicy.authorize(req['user'], 'view', id);
    return this.meetingService.get(id);
  }

  @Post(':id/send-reminder')
  async sendReminder(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.meetingPolicy.authorize(req['user'], 'view', id);
    const authUserId = req['user'].id;
    return this.meetingService.sendReminder(id, authUserId);
  }

  @Put(':id')
  async update(
    @Body() dto: MeetingUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.meetingPolicy.authorize(req['user'], 'update', id);
    const authUserId = req['user'].id;
    return this.meetingService.update(dto, id, authUserId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.meetingPolicy.authorize(req['user'], 'delete', id);
    const authUserId = req['user'].id;
    return this.meetingService.delete(id, authUserId);
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() dto: BulkDeleteDto, @Req() req: Request) {
    for (const id of dto.ids) {
      await this.meetingPolicy.authorize(req['user'], 'delete', id);
    }
    const authUserId = req['user'].id;
    return this.meetingService.bulkDelete(dto.ids, authUserId);
  }

  @Post('bulk-update')
  async bulkUpdate(@Body() dto: BulkUpdateDto, @Req() req: Request) {
    for (const id of dto.ids) {
      await this.meetingPolicy.authorize(req['user'], 'update', id);
    }
    const authUserId = req['user'].id;
    return this.meetingService.bulkUpdate(dto.ids, dto.data, authUserId);
  }
}
