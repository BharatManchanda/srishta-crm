import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { ForbiddenException } from '@nestjs/common';
@Injectable()
export class RolePermissionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userHierarchyService: UserHierarchyService,
  ) {}
  async get(roleId: number, authId: number) {
    const familyUserIds = await this.userHierarchyService.getFamilyUserIds(authId)
    const isExistRole = await this.prismaService.role.findUnique({
      where: {
        id: roleId,
        createdById: {
          in: familyUserIds
        },
      },
    });

    if (!isExistRole) {
      throw new NotFoundException('Role not found');
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
        id: 'asc',
      },
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
      },
    });
  }

  async update(dto: CreateRolePermissionDto, authId: number) {
    let {
      roleId,
      moduleId,
      isAllow,
      canView,
      canCreate,
      canEdit,
      canDelete,
      actions = [],
    } = dto;


    if (roleId) {
      const isSuperAdminPermission = await this.prismaService.user.findFirst({
        where: {
          roleId,
          isSuperAdmin: true,
        },
      });

      if (isSuperAdminPermission) {
        throw new ForbiddenException('Super admin role cannot be updated');
      }
    }

    if (!isAllow || !canView) {
      canView = false;
      canCreate = false;
      canEdit = false;
      canDelete = false;
    }

    const isExist = await this.prismaService.role.findUnique({
      where: {
        id: roleId,
        createdById: authId,
      },
    });


    if (!isExist) {
      throw new NotFoundException('Role not found');
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
        actions,
      },
    });
  }
}
