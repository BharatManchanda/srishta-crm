import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MeetingService } from './meeting.service';
import { MeetingFilterDto } from './dto/meeting-filter.dto';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';
import { MeetingPolicy } from './meeting.policy';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

@UseGuards(AuthGuard)
@Controller('meeting')
export class MeetingController {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly meetingPolicy: MeetingPolicy,
  ) {}

  @Get()
  async getList(@Query() dto: MeetingFilterDto, @Req() req: Request) {
    await this.meetingPolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    return this.meetingService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: MeetingCreateDto, @Req() req: Request) {
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
}
