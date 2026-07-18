import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class GoogleCalendarService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('google-calendar-sync') private readonly calendarSyncQueue: Queue,
    ) { }

    private oauthClient() {
        return new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI,
        );
    }

    generateAuthUrl(userId: number) {
        const client = this.oauthClient();

        return client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar'],
            state: userId.toString(),
        });
    }

    async handleGoogleCallback(code: string, authUserId: number) {
        const client = this.oauthClient();
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            version: 'v2',
            auth: client,
        });

        const { data } = await oauth2.userinfo.get();

        const existing = await this.prisma.googleCalendar.findUnique({
            where: {
                connectedById: authUserId,
            },
        });

        await this.prisma.googleCalendar.upsert({
            where: {
                connectedById: authUserId,
            },
            update: {
                googleId: data.id!,
                email: data.email,
                name: data.name,
                accessToken: tokens.access_token ?? existing?.accessToken ?? '',
                refreshToken: tokens.refresh_token ?? existing?.refreshToken ?? '',
                expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : existing?.expiryDate,
            },
            create: {
                connectedById: authUserId,
                googleId: data.id!,
                email: data.email,
                name: data.name,
                accessToken: tokens.access_token ?? '',
                refreshToken: tokens.refresh_token ?? '',
                expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
            },
        });

        await this.calendarSyncQueue.add('sync-all-user-events', { userId: authUserId });

        return {
            message: 'Google Calendar connected successfully.',
            account: {
                id: data.id,
                email: data.email,
                name: data.name,
            },
        };
    }

    async getCalendar(authUserId: number) {
        const calendar = await this.prisma.googleCalendar.findFirst({
            where: {
            connectedById: authUserId,
            },
        });

        if (!calendar) return null;

        return {
            ...calendar,
            expiryDate: calendar.expiryDate?.toString(),
        };
    }

    private async getGoogleClient(userId: number) {
        const account = await this.prisma.googleCalendar.findFirst({
            where: {
                connectedById: userId,
            },
        });

        if (!account) {
            throw new NotFoundException('Google Calendar is not connected.');
        }

        const client = this.oauthClient();

        client.setCredentials({
            access_token: account.accessToken,
            refresh_token: account.refreshToken,
            expiry_date: account.expiryDate ? Number(account.expiryDate) : undefined,
        });

        const { credentials } = await client.refreshAccessToken();

        if (credentials.access_token) {
            await this.prisma.googleCalendar.update({
                where: {
                    connectedById: userId,
                },
                data: {
                    accessToken: credentials.access_token,
                    expiryDate: credentials.expiry_date
                        ? BigInt(credentials.expiry_date)
                        : account.expiryDate,
                },
            });

            client.setCredentials({
                access_token: credentials.access_token,
                refresh_token: account.refreshToken,
            });
        }

        return client;
    }

    async getEvents(userId: number) {
        const client = await this.getGoogleClient(userId);

        const calendar = google.calendar({
            version: 'v3',
            auth: client,
        });

        const response = await calendar.events.list({
            calendarId: 'primary',
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 50,
        });

        return response.data.items;
    }

    async createEvent(userId: number, event: CreateCalendarEventDto) {
        const client = await this.getGoogleClient(userId);

        const calendar = google.calendar({
            version: 'v3',
            auth: client,
        });

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: event.summary,
                description: event.description,
                location: event.location,
                start: {
                    dateTime: event.start,
                },
                end: {
                    dateTime: event.end,
                },
            },
        });

        return response.data;
    }

    async updateEvent(userId: number, eventId: string, event: CreateCalendarEventDto) {
        const client = await this.getGoogleClient(userId);

        const calendar = google.calendar({
            version: 'v3',
            auth: client,
        });

        try {
            const response = await calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                requestBody: {
                    summary: event.summary,
                    description: event.description,
                    location: event.location,
                    start: {
                        dateTime: event.start,
                    },
                    end: {
                        dateTime: event.end,
                    },
                },
            });

            return response.data;
        } catch (error: any) {
            if (error.code === 404 || error.code === 410) {
                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: {
                        summary: event.summary,
                        description: event.description,
                        location: event.location,
                        start: {
                            dateTime: event.start,
                        },
                        end: {
                            dateTime: event.end,
                        },
                    },
                });
                return response.data;
            }
            throw error;
        }
    }

    async deleteEvent(userId: number, eventId: string) {
        const client = await this.getGoogleClient(userId);

        const calendar = google.calendar({
            version: 'v3',
            auth: client,
        });

        try {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });
        } catch (error: any) {
            if (error.code !== 404 && error.code !== 410) {
                throw error;
            }
        }
    }

    async manualSync(userId: number) {
        const account = await this.prisma.googleCalendar.findFirst({
            where: {
                connectedById: userId,
            },
        });

        if (!account) {
            throw new NotFoundException('Google Calendar is not connected.');
        }

        await this.calendarSyncQueue.add('manual-sync-all-user-events', { userId });

        return {
            message: 'Google Calendar manual synchronization initiated.',
        };
    }

    async disconnect(userId: number) {
        const account = await this.prisma.googleCalendar.findUnique({
            where: {
                connectedById: userId,
            },
        });

        if (!account) {
            throw new BadRequestException(
                'Google Calendar is not connected.',
            );
        }

        await this.prisma.googleCalendar.delete({
            where: {
                connectedById: userId,
            },
        });

        return {
            message: 'Google Calendar disconnected successfully.',
        };
    }
}