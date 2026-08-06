import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolePermissionService } from './role-permission.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { UpdateRolePermissionDto } from './dto/update-role-permission.dto';

@UseGuards(AuthGuard)
@Controller('role-permission')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const authId = req['user'].id;
    return this.rolePermissionService.get(id, authId);
  }

  @Post()
  async create(@Body() dto: CreateRolePermissionDto, @Req() req: Request) {
    const authId = req['user'].id;
    return this.rolePermissionService.create(dto, authId);
  }

  @Put()
  async update(@Body() dto: UpdateRolePermissionDto, @Req() req: Request) {
    const authId = req['user'].id;
    return this.rolePermissionService.update(dto, authId);
  }
}
