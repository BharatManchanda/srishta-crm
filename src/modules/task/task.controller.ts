import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TaskService } from './task.service';
import { TaskFilterDto } from './dto/task-filter.dto';
import { TaskCreateDto } from './dto/task-create.dto';
import { TaskUpdateDto } from './dto/task-update.dto';
import { TaskPolicy } from './task.policy';
import { BulkTaskCreateDto } from './dto/bulk-task-create.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';


@UseGuards(AuthGuard)
@Controller('task')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly taskPolicy: TaskPolicy,
  ) {}

  @Get('view-setting')
  async viewSetting(@Req() req: Request) {
    const authUserId = req['user'].id;
    return this.taskService.viewSetting(authUserId);
  }

  @Put('update-setting')
  async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    return this.taskService.updateSetting(dto, authUserId);
  }

  @Get()
  async getList(@Query() dto: TaskFilterDto, @Req() req: Request) {
    await this.taskPolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    return this.taskService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: TaskCreateDto, @Req() req: Request) {
    await this.taskPolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.taskService.create(dto, authUserId);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.taskPolicy.authorize(req['user'], 'view', id);
    return this.taskService.get(id);
  }

  @Put(':id')
  async update(
    @Body() dto: TaskUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.taskPolicy.authorize(req['user'], 'update', id);
    const authUserId = req['user'].id;
    return this.taskService.update(dto, id, authUserId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.taskPolicy.authorize(req['user'], 'delete', id);
    const authUserId = req['user'].id;
    return this.taskService.delete(id, authUserId);
  }

  @Post('bulk')
  async bulkCreate(@Body() dto: BulkTaskCreateDto, @Req() req: Request) {
    await this.taskPolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.taskService.bulkCreate(dto, authUserId);
  }

  @Post('bulk-delete')
  async bulkDelete(@Body('ids') ids: number[], @Req() req: Request) {
    for (const id of ids) {
      await this.taskPolicy.authorize(req['user'], 'delete', id);
    }
    const authUserId = req['user'].id;
    return this.taskService.bulkDelete(ids, authUserId);
  }

  @Post('bulk-update')
  async bulkUpdate(@Body('ids') ids: number[], @Body('data') data: any, @Req() req: Request) {
    for (const id of ids) {
      await this.taskPolicy.authorize(req['user'], 'update', id);
    }
    const authUserId = req['user'].id;
    return this.taskService.bulkUpdate(ids, data, authUserId);
  }
}

