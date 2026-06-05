import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class JwtService {
    constructor(private readonly jwtService: NestJwtService, private readonly prisma: PrismaService,) { }
    async generateAccessToken(payload: any): Promise<string> {
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15d',
        },
        );

        await this.prisma.user.update({
            where: {
                id: payload.id,
            },
            data: {
                accessTokens: {
                    push: accessToken,
                },
            },
        });

        return accessToken;
    }

    async generateRefreshToken(payload: any): Promise<string> {
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '30d',
        });

        await this.prisma.user.update({
            where: {
                id: payload.id,
            },
            data: {
                refreshTokens: {
                    push: refreshToken,
                },
            },
        });

        return refreshToken;
    }

    async generateTokens(user: any) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = await this.generateAccessToken(payload);

        const refreshToken = await this.generateRefreshToken(payload);

        return {
            accessToken,
            refreshToken,
        };
    }

    async verifyAccessToken(token: string) {
        const decoded = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_ACCESS_SECRET,
        });

        if (!decoded) {
            throw new UnauthorizedException(
                'Access token not found',
            );
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const exists = user.accessTokens.includes(token);

        if (!exists) {
            throw new UnauthorizedException('Access token not found');
        }

        return decoded;
    }
    async verifyRefreshToken(token: string) {
        const decoded = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_REFRESH_SECRET,
        });

        if (!decoded) {
            throw new UnauthorizedException('Refresh token not found');
        }
        const user = await this.prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const exists = user.refreshTokens.includes(token);
        if (!exists) {
            throw new UnauthorizedException('Refresh token not found');
        }

        return decoded;
    }

    async regenerateAccessToken(refreshToken: string) {
        const decoded = await this.verifyRefreshToken(refreshToken);

        const payload = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };

        const accessToken = await this.generateAccessToken(payload);

        return accessToken;
    }

    async revokeTokens(userId: number, accessToken: string, refreshToken: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (!user) return;
        await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                accessTokens: user.accessTokens.filter((token) => token !== accessToken),
                refreshTokens: user.refreshTokens.filter((token) => token !== refreshToken),
            },
        });
    }
}
