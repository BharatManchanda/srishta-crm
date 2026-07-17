import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ActivityService } from './activity.service';
import { ActivityFilterDto } from './dto/activity-filter.dto';
import { CreateActivityDto } from './dto/activity.dto';

@UseGuards(AuthGuard)
@Controller('activity')
export class ActivityController {

    constructor(
        private readonly activityService: ActivityService,
    ) { }

    @Get()
    async get(@Query() dto: ActivityFilterDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.activityService.getList(dto, authUserId);
    }

    @Post()
    async create(@Body() dto: CreateActivityDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.activityService.create(dto, authUserId);
    }
}
