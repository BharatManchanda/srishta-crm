import { Injectable } from '@nestjs/common';
import { UserFilterDto } from './dto/user-filter.dto';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';

@Injectable()
export class UserFilterBuilder {
    constructor() { }

  build(dto: UserFilterDto) {

    return {

      // id: dto.id ? dto.id : undefined,

      name: PrismaFilter.contains(dto.name),

      email: PrismaFilter.contains(dto.email),

      roleId: dto.roleId ? Number(dto.roleId) : undefined,

      status: dto.status,

      accessLevel: dto.accessLevel,

      phone: PrismaFilter.contains(dto.phone),

      bio: PrismaFilter.contains(dto.bio),

      country: PrismaFilter.contains(dto.country),

      city: PrismaFilter.contains(dto.city),

      pincode: PrismaFilter.contains(dto.pincode),

      tax_id: PrismaFilter.contains(dto.tax_id),
    };
  }
}
