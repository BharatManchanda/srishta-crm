import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolePermissionService } from './role-permission.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';
import { RolePolicy } from '../role/role.policy';

@UseGuards(AuthGuard)
@Controller('role-permission')
export class RolePermissionController {
  constructor(
    private readonly rolePermissionService: RolePermissionService,
    private readonly rolePolicy: RolePolicy,
  ) {}

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const currentUser = req['user']
    await this.rolePolicy.authorize(currentUser, 'view', id);
    return this.rolePermissionService.get(id, currentUser.id);
  }

  @Post()
  async create(@Body() dto: CreateRolePermissionDto, @Req() req: Request) {
    const authId = req['user'].id;
    return this.rolePermissionService.create(dto, authId);
  }

  @Put()
  async update(@Body() dto: UpdateRolePermissionDto, @Req() req: Request) {
    const currentUser = req['user']
    await this.rolePolicy.authorize(currentUser, 'update', dto.roleId);
    const authId = req['user'].id;
    console.log("::test")
    return this.rolePermissionService.update(dto, authId);
  }
}
