import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { LeadSyncChainCreateDto } from './dto/lead-sync-chain-create.dto';
import { LeadSyncChainService } from './lead-sync-chain.service';
import { LeadSyncChainFilterDto } from './dto/lead-sync-chain-filter.dto';

@UseGuards(AuthGuard)
@Controller('lead-sync-chain')
export class LeadSyncChainController {
    constructor(
        private readonly leadSyncChainService: LeadSyncChainService
    ) {}

    @Post()
    async create(@Body() dto: LeadSyncChainCreateDto, @Req() req: Request) {
        const userId = req['user'].id;
        return await this.leadSyncChainService.create(dto, userId);
    }

    @Get()
    async get(@Query() dto: LeadSyncChainFilterDto, @Req() req: Request) {
        const userId = req['user'].id;
        return await this.leadSyncChainService.get(dto, userId);
    }

    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        const userId = req['user'].id;
        return this.leadSyncChainService.getOne(id, userId);
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        const userId = req['user'].id;
        return this.leadSyncChainService.delete(id, userId);
    }
}
