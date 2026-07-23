import { Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

@UseGuards(AuthGuard)
@Controller('notification')
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
    ) { }

    @Get()
    async getList(@Query() paginationDto: PaginationDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.notificationService.getList(authUserId, paginationDto);
    }

    @Patch(':id/read')
    async read(@Param('id') id: string, @Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.notificationService.markAsRead(Number(id), authUserId);
    }

    @Patch('read-all')
    async readAll(@Query() dto: PaginationDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.notificationService.markAllAsRead(authUserId, "unread");
    }

    @Patch(':id/archive')
    async archive(@Param('id') id: string, @Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.notificationService.archive(Number(id), authUserId);
    }

    @Get('unread-count')
    async unreadCount(@Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.notificationService.unreadCount(authUserId);
    }
}
