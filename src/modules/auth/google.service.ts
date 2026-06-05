import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleService {
    private client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
    );

    async verifyToken(idToken: string) {
        const ticket = await this.client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        return ticket.getPayload();
    }
}