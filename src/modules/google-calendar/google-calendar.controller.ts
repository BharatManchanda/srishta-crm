import { Controller, Get, Post, Query, Req, Res, UseGuards, Delete } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { Response } from 'express';

@Controller('google-calendar')
export class GoogleCalendarController {
    constructor(private readonly googleService: GoogleCalendarService) { }

    @UseGuards(AuthGuard)
    @Get('auth')
    async auth(@Req() req: Request) {
        const authUserId = req['user'].id;
        return {
            url: this.googleService.generateAuthUrl(authUserId),
        };
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
        const authUserId = parseInt(state, 10);
        await this.googleService.handleGoogleCallback(code, authUserId);
        return res.redirect(`${process.env.FRONTEND_URL}/connects`);
    }

    @UseGuards(AuthGuard)
    @Get('events')
    async events(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.googleService.getEvents(authUserId);
    }

    @UseGuards(AuthGuard)
    @Get()
    async get(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.googleService.getCalendar(authUserId);
    }

    @UseGuards(AuthGuard)
    @Post('sync')
    async sync(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.googleService.manualSync(authUserId);
    }

    @UseGuards(AuthGuard)
    @Delete()
    async disconnect(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.googleService.disconnect(authUserId);
    }
}
