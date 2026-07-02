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
  @Get('straight-list')
  async getStraightList() {
    return this.moduleService.getStraightList();
  }

  @Get()
  async search(@Query() dto: SearchDto) {
    return this.moduleService.search(dto);
  }
}
