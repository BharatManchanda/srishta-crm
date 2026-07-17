import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CallService } from './call.service';
import { CallFilterDto } from './dto/call-filter.dto';
import { CallCreateDto } from './dto/call-create.dto';
import { CallUpdateDto } from './dto/call-update.dto';
import { CallPolicy } from './call.policy';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

@UseGuards(AuthGuard)
@Controller('call')
export class CallController {
  constructor(
    private readonly callService: CallService,
    private readonly callPolicy: CallPolicy,
  ) {}

  @Get()
  async getList(@Query() dto: CallFilterDto, @Req() req: Request) {
    await this.callPolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    return this.callService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: CallCreateDto, @Req() req: Request) {
    await this.callPolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.callService.create(dto, authUserId);
  }

  @Get('view-setting')
  async viewSetting(@Req() req: Request) {
    const authUserId = req['user'].id;
    return this.callService.viewSetting(authUserId);
  }

  @Put('update-setting')
  async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    return this.callService.updateSetting(dto, authUserId);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.callPolicy.authorize(req['user'], 'view', id);
    return this.callService.get(id);
  }

  @Put(':id')
  async update(
    @Body() dto: CallUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.callPolicy.authorize(req['user'], 'update', id);
    const authUserId = req['user'].id;
    return this.callService.update(dto, id, authUserId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.callPolicy.authorize(req['user'], 'delete', id);
    const authUserId = req['user'].id;
    return this.callService.delete(id, authUserId);
  }
}
