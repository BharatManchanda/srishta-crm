import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { DealService } from './deal.service';
import { ModuleFieldService } from '../module-field/module-field.service';
import { DEAL_MODULE_ID } from 'src/seeders/module.seeder';
import { ModuleEnum } from '../module-field/dto/module-field-create.dto';
import { DealPolicy } from './deal.policy';
import { DealFilterDto } from './dto/deal-filter.dto';
import { DealCreateDto } from './dto/deal-create.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { DealUpdateDto } from './dto/deal-update.dto';
import { BulkDeleteDto } from 'src/common/dto/bulk-delete.dto';
import { BulkUpdateDto } from 'src/common/dto/bulk-update.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('deals')
export class DealController {
    constructor(
        private readonly dealService: DealService,
        private readonly dealPolicy: DealPolicy,
        private readonly moduleFieldService: ModuleFieldService,
      ) {
      }
      
      @Get()
      async getList(@Query() dto: DealFilterDto, @Req() req: Request) {
        await this.dealPolicy.authorize(req['user'], 'viewAll');
        const authUserId = req['user'].id;
        await this.moduleFieldService.createDefault(DEAL_MODULE_ID, ModuleEnum.DEAL, authUserId);
        return this.dealService.getList(dto, authUserId);
      }
    
      @Post()
      async create(@Body() dto: DealCreateDto, @Req() req: Request) {
        await this.dealPolicy.authorize(req['user'], 'create');
        await this.moduleFieldService.validateRequiredFields(DEAL_MODULE_ID, req['user'].id, dto);
        const authUserId = req['user'].id;
        return this.dealService.create(dto, authUserId);
      }
    
      @Get('view-setting')
      async viewSetting(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.dealService.viewSetting(authUserId);
      }
    
      @Put('update-setting')
      async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.dealService.updateSetting(dto, authUserId);
      }
    
      @Get(':id')
      async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        await this.dealPolicy.authorize(req['user'], 'view', id);
        const authUserId = req['user'].id;
        return this.dealService.get(id, authUserId);
      }
    
      @Put(':id')
      async update(
        @Body() dto: DealUpdateDto,
        @Param('id', ParseIntPipe) id: number,
        @Req() req: Request,
      ) {
        const authUserId = req['user'].id;
        await this.dealPolicy.authorize(req['user'], 'update', id);
        const existingData = await this.dealService.get(id, authUserId);
        await this.moduleFieldService.validateRequiredFields(DEAL_MODULE_ID, req['user'].id, dto, existingData);
        return this.dealService.update(dto, id, authUserId);
      }
    
      @Delete(':id')
      async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        await this.dealPolicy.authorize(req['user'], 'delete', id);
        const authUserId = req['user'].id;
        return this.dealService.delete(id, authUserId);
      }
    
      @Post('bulk-delete')
      async bulkDelete(@Body() dto: BulkDeleteDto, @Req() req: Request) {
        for (const id of dto.ids) {
          await this.dealPolicy.authorize(req['user'], 'delete', id);
        }
        const authUserId = req['user'].id;
        return this.dealService.bulkDelete(dto.ids, authUserId);
      }
    
      @Post('bulk-update')
      async bulkUpdate(@Body() dto: BulkUpdateDto, @Req() req: Request) {
        for (const id of dto.ids) {
          await this.dealPolicy.authorize(req['user'], 'update', id);
        }
        const authUserId = req['user'].id;
        return this.dealService.bulkUpdate(dto.ids, dto.data, authUserId);
      }
}
