import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ModuleService } from './module.service';
import { SearchDto } from './dto/search.dto';

@Controller('module')
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getList(@Req() req: Request) {
    const currentUser = req['user'];
    return this.moduleService.getList(currentUser);
  }

  @UseGuards(AuthGuard)
  @Get("all")
  async getAllList() {
    return await this.moduleService.getAllList();
  }

  @UseGuards(AuthGuard)
  @Get('straight-list')
  async getStraightList() {
    return this.moduleService.getStraightList();
  }

  @UseGuards(AuthGuard)
  @Get('search')
  async search(@Query() dto: SearchDto, @Req() req: Request) {
    const authUser = req['user'];
    return this.moduleService.search(dto, authUser);
  }
}
