import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ModuleService } from './module.service';

@Controller('module')
export class ModuleController {
    constructor(private readonly moduleService: ModuleService) {}

    @UseGuards(AuthGuard)
    @Get()
    async getList() {
        return this.moduleService.getList();
    }
}
