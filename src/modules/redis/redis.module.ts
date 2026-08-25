import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({

    imports: [UserModule, PrismaModule],
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule {}
