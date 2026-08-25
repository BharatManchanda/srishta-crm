import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolePolicy } from './role.policy';
@UseGuards(AuthGuard)
@Controller('role')
export class RoleController {
    constructor(
        private readonly roleService: RoleService,
        private readonly rolePolicy: RolePolicy,
    ) { }

    @Get()
    async getList(@Req() req: Request) {
        const currentUser = req['user']
        await this.rolePolicy.authorize(currentUser, 'viewAll');
        return this.roleService.getList(currentUser.id);
    }

    @Post()
    async create(@Body() dto: CreateRoleDto, @Req() req: Request) {
        const currentUser = req['user']
        await this.rolePolicy.authorize(currentUser, 'create');
        return this.roleService.create(dto, currentUser.id);
    }

    @Put(":id")
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto, @Req() req: Request) {
        const currentUser = req['user']
        await this.rolePolicy.authorize(currentUser, 'update', id);
        return this.roleService.update(dto, id, currentUser.id);
    }

    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        const currentUser = req['user']
        await this.rolePolicy.authorize(currentUser, 'delete', id);
        return this.roleService.delete(id, currentUser.id);
    }

    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        const currentUser = req['user']
        await this.rolePolicy.authorize(currentUser, 'view', id);
        return this.roleService.getOne(id);
    }
}
