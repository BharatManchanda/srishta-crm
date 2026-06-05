import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

@Module({
    imports: [PrismaModule, NestJwtModule.register({})],
    providers: [JwtService],
    exports: [JwtService],
})
export class JwtModule { }