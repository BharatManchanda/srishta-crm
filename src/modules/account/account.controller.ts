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
import { AccountService } from './account.service';
import { AccountFilterDto } from './dto/account-filter.dto';
import { AccountCreateDto } from './dto/account-create.dto';
import { UpdateViewSettingDto } from './dto/account-view-setting.dto';
import { AccountUpdateDto } from './dto/account-update.dto';
import { AccountPolicy } from './account.policy';
import { BulkDeleteDto } from '../../common/dto/bulk-delete.dto';
import { BulkUpdateDto } from '../../common/dto/bulk-update.dto';


@UseGuards(AuthGuard)
@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly accountPolicy: AccountPolicy,
  ) {}

  @Get()
  async getList(@Query() dto: AccountFilterDto, @Req() req: Request) {
    await this.accountPolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    return this.accountService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: AccountCreateDto, @Req() req: Request) {
    await this.accountPolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.accountService.create(dto, authUserId);
  }

  @Get('view-setting')
  async viewSetting(@Req() req: Request) {
    const authUserId = req['user'].id;
    return this.accountService.viewSetting(authUserId);
  }

  @Put('update-setting')
  async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    return this.accountService.updateSetting(dto, authUserId);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.accountPolicy.authorize(req['user'], 'view', id);
    return this.accountService.get(id);
  }

  @Put(':id')
  async update(
    @Body() dto: AccountUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.accountPolicy.authorize(req['user'], 'update', id);
    const authUserId = req['user'].id;
    return this.accountService.update(id, dto, authUserId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.accountPolicy.authorize(req['user'], 'delete', id);
    const authUserId = req['user'].id;
    return this.accountService.delete(id, authUserId);
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() dto: BulkDeleteDto, @Req() req: Request) {
    for (const id of dto.ids) {
      await this.accountPolicy.authorize(req['user'], 'delete', id);
    }
    const authUserId = req['user'].id;
    return this.accountService.bulkDelete(dto.ids, authUserId);
  }

  @Post('bulk-update')
  async bulkUpdate(@Body() dto: BulkUpdateDto, @Req() req: Request) {
    for (const id of dto.ids) {
      await this.accountPolicy.authorize(req['user'], 'update', id);
    }
    const authUserId = req['user'].id;
    return this.accountService.bulkUpdate(dto.ids, dto.data, authUserId);
  }
}

