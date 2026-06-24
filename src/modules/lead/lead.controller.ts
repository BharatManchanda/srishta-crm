import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { LeadService } from './lead.service';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { LeadCreateDto } from './dto/lead-create.dto';
import { LeadUpdateDto } from './dto/lead-update.dto';

@UseGuards(AuthGuard)
@Controller('lead')
export class LeadController {
    constructor(private readonly leadService: LeadService) { }

    @Get()
    async getList(@Query() dto: LeadFilterDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.leadService.getList(dto, authUserId);
    }

    @Post()
    async create(@Body() dto: LeadCreateDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.leadService.create(dto, authUserId);
    }

    @Get(":id")
    async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.leadService.get(id, authUserId);
    }

    @Put(":id")
    async update(@Body() dto: LeadUpdateDto, @Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.leadService.update(dto, id, authUserId);
    }
}
