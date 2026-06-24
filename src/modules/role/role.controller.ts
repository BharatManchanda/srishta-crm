import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
@UseGuards(AuthGuard)
@Controller('role')
export class RoleController {
    constructor(private readonly roleService: RoleService) { }

    @Get()
    async getList(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.roleService.getList(authUserId);
    }

    @Post()
    async create(@Body() dto: CreateRoleDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.roleService.create(dto, authUserId);
    }

    @Put(":id")
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.roleService.update(dto, id, authUserId);
    }

    @Delete()
    async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.roleService.delete(id, authUserId);
    }

    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id: number) {
        return this.roleService.getOne(id);
    }
}
