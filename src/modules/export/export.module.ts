import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { ExportService } from './export.service';
import { LeadModule } from '../lead/lead.module';
import { ContactModule } from '../contact/contact.module';
import { UserModule } from '../user/user.module';
import { AccountModule } from '../account/account.module';
import { ExportController } from './export.controller';

@Module({
    imports: [PrismaModule, JwtModule, LeadModule, ContactModule, UserModule, AccountModule],
    controllers: [ExportController],
    providers: [ExportService],
})
export class ExportModule {}

