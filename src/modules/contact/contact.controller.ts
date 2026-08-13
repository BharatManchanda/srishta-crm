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
import { ContactService } from './contact.service';
import { ContactFilterDto } from './dto/contact-filter.dto';
import { ContactCreateDto } from './dto/contact-create.dto';
import { UpdateViewSettingDto } from './dto/contact-view-setting.dto';
import { ContactUpdateDto } from './dto/contact-update.dto';
import { ContactPolicy } from './contact.policy';
import { BulkDeleteDto } from '../../common/dto/bulk-delete.dto';
import { BulkUpdateDto } from '../../common/dto/bulk-update.dto';
import { ModuleFieldService } from '../module-field/module-field.service';
import { ModuleEnum } from '../module-field/dto/module-field-create.dto';
import { CONTACT_MODULE_ID } from 'src/seeders/module.seeder';


@UseGuards(AuthGuard)
@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly contactPolicy: ContactPolicy,
    private readonly moduleFieldService: ModuleFieldService,
  ) {}

  @Get()
  async getList(@Query() dto: ContactFilterDto, @Req() req: Request) {
    await this.contactPolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    await this.moduleFieldService.createDefault(CONTACT_MODULE_ID, ModuleEnum.CONTACT, authUserId);
    return this.contactService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: ContactCreateDto, @Req() req: Request) {
    await this.moduleFieldService.validateRequiredFields(CONTACT_MODULE_ID, req['user'].id, dto);
    await this.contactPolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.contactService.create(dto, authUserId);
  }

  @Get('view-setting')
  async viewSetting(@Req() req: Request) {
    const authUserId = req['user'].id;
    return this.contactService.viewSetting(authUserId);
  }

  @Put('update-setting')
  async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
    const authUserId = req['user'].id;
    return this.contactService.updateSetting(dto, authUserId);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.contactPolicy.authorize(req['user'], 'view', id);
    const authUserId = req['user'].id;
    return this.contactService.get(id, authUserId);
  }

  @Put(':id')
  async update(
    @Body() dto: ContactUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.contactPolicy.authorize(req['user'], 'update', id);
    const authUserId = req['user'].id;
    return this.contactService.update(dto, id, authUserId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.contactPolicy.authorize(req['user'], 'delete', id);
    const authUserId = req['user'].id;
    return this.contactService.delete(id, authUserId);
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() dto: BulkDeleteDto, @Req() req: Request) {
    for (const id of dto.ids) {
      await this.contactPolicy.authorize(req['user'], 'delete', id);
    }
    const authUserId = req['user'].id;
    return this.contactService.bulkDelete(dto.ids, authUserId);
  }

  @Post('bulk-update')
  async bulkUpdate(@Body() dto: BulkUpdateDto, @Req() req: Request) {
    for (const id of dto.ids) {
      await this.contactPolicy.authorize(req['user'], 'update', id);
    }
    const authUserId = req['user'].id;
    return this.contactService.bulkUpdate(dto.ids, dto.data, authUserId);
  }
}

