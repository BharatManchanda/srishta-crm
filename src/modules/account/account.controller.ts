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

@UseGuards(AuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async getList(@Query() dto: AccountFilterDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    return this.accountService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: AccountCreateDto, @Req() req: Request) {
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
    return this.accountService.get(id);
  }

  @Put(':id')
  async update(
    @Body() dto: AccountUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.accountService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.accountService.delete(id);
  }
}
