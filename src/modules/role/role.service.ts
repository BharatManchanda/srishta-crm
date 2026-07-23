import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserHierarchyService } from '../user/user-hierarchy.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userHierarchyService: UserHierarchyService,
  ) {}
  async getList(authUserId: number) {
    return await this.prisma.role.findMany({
      where: {
        createdById: {
          in: await this.userHierarchyService.getFamilyUserIds(authUserId),
        },
      },
    });
  }

  async getOne(id: number) {
    return await this.prisma.role.findFirst({
      where: {
        id: id,
      },
    });
  }

  async create(dto: CreateRoleDto, authUserId: number) {
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdById: authUserId,
      },
    });

    const modules = await this.prisma.module.findMany();

    await this.prisma.rolePermission.createMany({
      data: modules.map((module) => ({
        roleId: role.id,
        moduleId: module.id,
        isAllow: true,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      })),
    });
    return role;
  }

  async update(dto: UpdateRoleDto, id: number, authUserId: number) {
    const isExistRole = await this.prisma.role.findFirst({
      where: {
        id: id,
        createdById: authUserId,
      },
    });
    if (!isExistRole) {
      throw new NotFoundException('Role not found');
    }

    return await this.prisma.role.update({
      where: {
        id: id,
      },
      data: {
        name: dto.name,
        description: dto.description,
        createdById: authUserId,
      },
    });
  }

  async delete(id: number, authUserId: number) {
    const assignedUsers = await this.prisma.user.count({
      where: {
        roleId: id,
      },
    });

    if (assignedUsers > 0) {
      throw new ConflictException('Cannot delete role because users are assigned to it');
    }

    return await this.prisma.role.delete({
      where: {
        id,
      },
    });
  }
}
