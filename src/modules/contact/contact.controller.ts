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
@UseGuards(AuthGuard)
@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    // private readonly contactPolicy: ContactPolicy
  ) {}

  @Get()
  async getList(@Query() dto: ContactFilterDto, @Req() req: Request) {
    // await this.contactPolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    return this.contactService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: ContactCreateDto, @Req() req: Request) {
    // await this.contactPolicy.authorize(req['user'], 'create');
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
    // await this.contactPolicy.authorize(req['user'], 'view', id);
    // const authUserId = req['user'].id;
    // console.log(id,":::::id")
    return this.contactService.get(id);
  }

  @Put(':id')
  async update(
    @Body() dto: ContactUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    // await this.contactPolicy.authorize(req['user'], 'update', id);
    const authUserId = req['user'].id;
    // return this.contactService.update(dto, id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    // await this.contactPolicy.authorize(req['user'], 'delete', id);
    const authUserId = req['user'].id;
    return this.contactService.delete(id);
  }
}
