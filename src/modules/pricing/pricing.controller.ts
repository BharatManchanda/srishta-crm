import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PricingService } from './pricing.service';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { CreatePricingPlanDto } from './dto/create-pricing-plan.dto';
import { UpdatePricingPlanDto } from './dto/update-pricing-plan.dto';
import { PricingPlanFilterDto } from './dto/pricing-filter.dto';
import { BulkDeleteDto } from 'src/common/dto/bulk-delete.dto';

// @UseGuards(AuthGuard)
@Controller('pricing')
export class PricingController {
    constructor(
        private readonly pricingService: PricingService,
    ) {}

    @Get()
    async list(@Query() dto: PricingPlanFilterDto) {
        return await this.pricingService.list(dto);
    }

    @UseGuards(AuthGuard)
    @Get('view-setting')
    async viewSetting(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.pricingService.viewSetting(authUserId);
    }

    @UseGuards(AuthGuard)
    @Put('update-setting')
    async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.pricingService.updateSetting(dto, authUserId);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
        async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        return this.pricingService.get(id);
    }

    @Post()
    async create(@Body() dto: CreatePricingPlanDto) {
        return this.pricingService.create(dto);
    }
  
    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePricingPlanDto) {
        return this.pricingService.update(id, dto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.pricingService.remove(id);
    }

    @Post('bulk-delete')
    async bulkDelete(@Body() dto: BulkDeleteDto, @Req() req: Request) {
        return this.pricingService.bulkDelete(dto.ids);
    }
}
