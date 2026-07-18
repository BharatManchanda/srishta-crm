import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
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
        return res.redirect('http://localhost:5173/connects');
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
        try {
            const authUserId = req['user'].id;
            return this.googleService.getCalendar(authUserId);
        } catch (error) {
            console.log(error,"::error");
            return error;
        }
    }
}
