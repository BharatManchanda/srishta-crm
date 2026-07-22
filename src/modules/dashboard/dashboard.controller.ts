import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardData(
    @Req() req: Request,
    @Query('interval') interval?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const authUserId = req['user'].id;
    return this.dashboardService.getDashboardData(authUserId, {
      interval,
      startDate,
      endDate,
    });
  }
}
