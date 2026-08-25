import 'dotenv/config';

import { PrismaClient, UserType, AccessLevel, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@srishta.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

export default async function seedAdmin() {
    try {
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        const adminUser = await prisma.user.upsert({
            where: {
                email: ADMIN_EMAIL,
            },

            update: {
                name: 'Main Admin',
                password: hashedPassword,
                userType: UserType.ADMIN,
                accessLevel: AccessLevel.ADMINISTRATIVE,
                isEmailVerified: true,
                status: UserStatus.ACTIVE,
                isSuperAdmin: true,
            },

            create: {
                name: 'Main Admin',
                email: ADMIN_EMAIL,
                password: hashedPassword,
                userType: UserType.ADMIN,
                accessLevel: AccessLevel.ADMINISTRATIVE,
                isEmailVerified: true,
                status: UserStatus.ACTIVE,
                isSuperAdmin: true,
            },
        });

        console.log('Main Admin seeding completed');
    } catch (error) {
        console.error('Failed to seed Main Admin');
        console.error(error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}