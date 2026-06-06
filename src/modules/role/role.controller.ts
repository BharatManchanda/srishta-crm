import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleService } from './role.service';
@UseGuards(AuthGuard)
@Controller('role')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}
    
    @Get()
    async getList(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.roleService.getList(authUserId);
    }
}
