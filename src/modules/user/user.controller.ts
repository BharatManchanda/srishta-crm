import { Controller, Get, Post, UseGuards, Delete, Put, Body, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserService } from './user.service';
import { RegisterDto } from '../auth/dto/register-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UpdateUserDto } from '../auth/dto/update-user.dto';
import { UserPolicy } from './user.policy';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly userPolicy: UserPolicy,
    ) { }

    @UseGuards(AuthGuard)
    @Get()
    async getList(@Query() dto: UserFilterDto, @Req() req: Request) {
        await this.userPolicy.authorize(req['user'], 'view');
        const authUserId = req['user'].id;
        return this.userService.getList(dto, authUserId);
    }

    @UseGuards(AuthGuard)
    @Post()
    async create(@Body() dto: RegisterDto, @Req() req: Request) {
        await this.userPolicy.authorize(req['user'], 'create');
        const authUserId = req['user'].id;
        return this.userService.create(dto, authUserId);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        await this.userPolicy.authorize(req['user'], 'view', id);
        return this.userService.getOne(id);
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        await this.userPolicy.authorize(req['user'], 'delete', id);
        return this.userService.delete(id);
    }

    @UseGuards(AuthGuard)
    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @Req() req: Request) {
        await this.userPolicy.authorize(req['user'], 'update', id);
        const authUserId = req['user'].id;
        return this.userService.update(dto, authUserId, id);
    }
}
