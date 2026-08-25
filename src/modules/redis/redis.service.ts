import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis;

    async onModuleInit() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT || 6379),
            password: process.env.REDIS_PASSWORD || undefined,
        });

        this.redis.on('connect', () => {
            console.log('Redis connected');
        });

        this.redis.on('error', (error) => {
            console.error('Redis error:', error);
        });

        await this.redis.ping();

        console.log('Redis ping successful');
    }

    async get<T>(key: string): Promise<T | null> {
        const value = await this.redis.get(key);

        if (!value) {
            return null;
        }

        return JSON.parse(value) as T;
    }

    async set<T>(
        key: string,
        value: T,
        ttlSeconds?: number,
    ): Promise<void> {
        const serializedValue = JSON.stringify(value);

        if (ttlSeconds) {
            await this.redis.set(
                key,
                serializedValue,
                'EX',
                ttlSeconds,
            );
        } else {
            await this.redis.set(key, serializedValue);
        }
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async onModuleDestroy() {
        if (this.redis) {
            await this.redis.quit();
        }
    }
}