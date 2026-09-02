import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ContactInquiryService } from './contact-inquiry.service';
import { ContactInquiryFilterDto } from './dto/contact-inquiry-filter.dto';
import { ContactInquiryCreateDto } from './dto/contact-inquiry-create.dto';
import { UpdateViewSettingDto } from './dto/contact-inquiry-view-setting.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ContactInquiryUpdateDto } from './dto/contact-inquiry-update.dto';

@Controller('contact-inquiry')
export class ContactInquiryController {
    constructor(
        private readonly contactInquiryService: ContactInquiryService,
    ) {}

    @Post()
    async create(@Body() dto: ContactInquiryCreateDto) {
        return await this.contactInquiryService.create(dto);
    }

    @Get()
    async getList(@Query() dto: ContactInquiryFilterDto, @Req() req: Request) {
    return await this.contactInquiryService.getList(dto);
    }

    @UseGuards(AuthGuard)
    @Get('view-setting')
    async viewSetting(@Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.contactInquiryService.viewSetting(authUserId);
    }

    @UseGuards(AuthGuard)
    @Put('update-setting')
    async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.contactInquiryService.updateSetting(dto, authUserId);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        return this.contactInquiryService.getOne(id);
    }

    @UseGuards(AuthGuard)
    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: ContactInquiryUpdateDto) {
        return await this.contactInquiryService.update(dto, id);
    }
}
