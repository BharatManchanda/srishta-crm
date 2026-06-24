import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserFilterBuilder } from './user-filter.builder';
import { UpdateUserDto } from '../auth/dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly paginationService: PaginationService,
        private readonly userFilterBuilder: UserFilterBuilder,
    ) { }

    async getList(dto: UserFilterDto, currentUserId: number) {
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };
        const result = await this.paginationService.paginate(this.prisma.user, {
            page: dto.page,
            perPage: dto.perPage,
            where: this.userFilterBuilder.build(dto, {
                parentId: currentUserId,
            }),

            orderBy,
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            }
        });
        return result;
    }

    async getOne(id: number) {
        return this.prisma.user.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async delete(id: number) {
        return this.prisma.user.delete({
            where: {
                id,
            },
        });
    }

    async update(dto: UpdateUserDto, authUserId: number, userId: number) {
        return this.authService.update(dto, authUserId, userId);
    }

    async create(dto: RegisterDto, authUserId: number) {
        return this.authService.register(dto, authUserId);
    }
}
