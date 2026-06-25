import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolePermissionFilterDto } from './dto/role-permission-filter.dto';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';

@Injectable()
export class RolePermissionService {
    constructor(
        private readonly prismaService: PrismaService
    ) { }
    async get(roleId: number, authId: number) {
        const isExistRole = await this.prismaService.role.findUnique({
            where: {
                id: roleId,
                createdById: authId
            }
        })

        if (!isExistRole) {
            throw new Error('Role not found');
        }

        return await this.prismaService.rolePermission.findMany({
            where: {
                roleId: roleId,
            },
            include: {
                role: true,
                module: true,
            },
            orderBy: {
                id: 'asc'
            }
        });
    }

    async create(dto: CreateRolePermissionDto, authId: number) {
        return await this.prismaService.rolePermission.create({
            data: {
                roleId: dto.roleId,
                moduleId: dto.moduleId,
                isAllow: dto.isAllow,
                canView: dto.canView,
                canCreate: dto.canCreate,
                canEdit: dto.canEdit,
                canDelete: dto.canDelete,
            }
        });
    }

    async update(dto: CreateRolePermissionDto, authId: number) {
        
        let { roleId, moduleId, isAllow, canView, canCreate, canEdit, canDelete } = dto;
        if (roleId) {
            const isSuperAdminPermission = await this.prismaService.user.findFirst({
                where: {
                    roleId,
                    isSuperAdmin: true
                }
            })

            if (isSuperAdminPermission) {
                throw new Error('Super admin role cannot be updated');
            }
        }

        // If module access is disabled
        if (!isAllow || !canView) {
            isAllow = false;
            canView = false;
            canCreate = false;
            canEdit = false;
            canDelete = false;
        }

        const isExist = await this.prismaService.role.findUnique({
            where: {
                id: roleId,
                createdById: authId
            },
        })

        if (!isExist) {
            throw new Error('Role not found');
        }

        return this.prismaService.rolePermission.update({
            where: {
                roleId_moduleId: {
                    roleId,
                    moduleId,
                },
            },
            data: {
                isAllow,
                canView,
                canCreate,
                canEdit,
                canDelete,
            },
        });
    }
}
