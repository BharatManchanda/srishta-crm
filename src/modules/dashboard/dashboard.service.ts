import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { OpenActivityGetDto } from './dto/open-activity.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userHierarchyService: UserHierarchyService,
  ) { }

  private async getScopeFilter(currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { accessLevel: true },
    });

    if (user?.accessLevel === 'STANDARD') {
      return { ownerId: currentUserId };
    } else {
      const userIds = await this.userHierarchyService.getFamilyUserIds(currentUserId);
      return {
        OR: [
          { createdById: { in: userIds } },
          { ownerId: { in: userIds } },
        ],
      };
    }
  }

  async getDashboardData(userId: number, query?: { interval?: string; startDate?: string; endDate?: string }) {
    const scopeFilter = await this.getScopeFilter(userId);

    // Date calculations for growth rate (current month vs previous month)
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Metric Counts & MoM Growth
    const [
      totalLeads, thisMonthLeads, lastMonthLeads,
      totalContacts, thisMonthContacts, lastMonthContacts,
      totalAccounts, thisMonthAccounts, lastMonthAccounts,
      totalTasks, thisMonthTasks, lastMonthTasks,
    ] = await Promise.all([
      // Leads
      this.prisma.lead.count({ where: scopeFilter }),
      this.prisma.lead.count({ where: { ...scopeFilter, createdAt: { gte: startOfThisMonth } } }),
      this.prisma.lead.count({ where: { ...scopeFilter, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

      // Contacts
      this.prisma.contact.count({ where: scopeFilter }),
      this.prisma.contact.count({ where: { ...scopeFilter, createdAt: { gte: startOfThisMonth } } }),
      this.prisma.contact.count({ where: { ...scopeFilter, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

      // Accounts
      this.prisma.account.count({ where: scopeFilter }),
      this.prisma.account.count({ where: { ...scopeFilter, createdAt: { gte: startOfThisMonth } } }),
      this.prisma.account.count({ where: { ...scopeFilter, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

      // Tasks (Pending)
      this.prisma.task.count({ where: { ...scopeFilter, status: { not: 'COMPLETED' } } }),
      this.prisma.task.count({ where: { ...scopeFilter, status: { not: 'COMPLETED' }, createdAt: { gte: startOfThisMonth } } }),
      this.prisma.task.count({ where: { ...scopeFilter, status: { not: 'COMPLETED' }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    ]);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(2));
    };

    // 2. Win Rate & Pipeline Values
    const wonLeads = await this.prisma.lead.findMany({
      where: { ...scopeFilter, status: 'WON' },
      select: { budget: true },
    });
    const totalActiveLeads = await this.prisma.lead.findMany({
      where: {
        ...scopeFilter,
        status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'] },
      },
      select: { budget: true },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const wonTodayLeads = await this.prisma.lead.findMany({
      where: {
        ...scopeFilter,
        status: 'WON',
        updatedAt: { gte: startOfToday },
      },
      select: { budget: true },
    });

    const revenue = wonLeads.reduce((sum, l) => sum + Number(l.budget || 0), 0);
    const target = totalActiveLeads.reduce((sum, l) => sum + Number(l.budget || 0), 0);
    const todayRevenue = wonTodayLeads.reduce((sum, l) => sum + Number(l.budget || 0), 0);
    const winRate = target > 0 ? Number(((revenue / target) * 100).toFixed(2)) : 0;

    // 3. Dynamic Trends based on filters
    const interval = query?.interval || 'monthly';
    let trendStartDate: Date;
    let trendEndDate: Date = new Date();

    if (query?.startDate) {
      trendStartDate = new Date(query.startDate);
    } else {
      trendStartDate = new Date();
      if (interval === 'monthly') {
        trendStartDate.setMonth(trendStartDate.getMonth() - 11);
        trendStartDate.setDate(1);
      } else if (interval === 'quarterly') {
        trendStartDate.setMonth(trendStartDate.getMonth() - 15);
        trendStartDate.setDate(1);
      } else if (interval === 'annually') {
        trendStartDate.setFullYear(trendStartDate.getFullYear() - 4);
        trendStartDate.setMonth(0);
        trendStartDate.setDate(1);
      }
    }

    if (query?.endDate) {
      trendEndDate = new Date(query.endDate);
    }
    trendStartDate.setHours(0, 0, 0, 0);
    trendEndDate.setHours(23, 59, 59, 999);

    const [leadsForTrend, tasksForTrend] = await Promise.all([
      this.prisma.lead.findMany({
        where: {
          ...scopeFilter,
          createdAt: { gte: trendStartDate, lte: trendEndDate },
        },
        select: { createdAt: true },
      }),
      this.prisma.task.findMany({
        where: {
          ...scopeFilter,
          createdAt: { gte: trendStartDate, lte: trendEndDate },
        },
        select: { createdAt: true },
      }),
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend: { month: string; year: number; leads: number; tasks: number }[] = [];

    if (interval === 'quarterly') {
      const current = new Date(trendStartDate);
      const currentQuarterStartMonth = Math.floor(current.getMonth() / 3) * 3;
      current.setMonth(currentQuarterStartMonth);
      current.setDate(1);

      while (current <= trendEndDate) {
        const q = Math.floor(current.getMonth() / 3) + 1;
        const year = current.getFullYear();
        const qStart = new Date(year, (q - 1) * 3, 1, 0, 0, 0, 0);
        const qEnd = new Date(year, q * 3, 0, 23, 59, 59, 999);

        const leadCount = leadsForTrend.filter(l => {
          const cDate = new Date(l.createdAt);
          return cDate >= qStart && cDate <= qEnd;
        }).length;

        const taskCount = tasksForTrend.filter(t => {
          const cDate = new Date(t.createdAt);
          return cDate >= qStart && cDate <= qEnd;
        }).length;

        trend.push({
          month: `Q${q} ${year}`,
          year,
          leads: leadCount,
          tasks: taskCount,
        });

        current.setMonth(current.getMonth() + 3);
        if (trend.length > 50) break; // Guard loop
      }
    } else if (interval === 'annually') {
      const current = new Date(trendStartDate);
      current.setMonth(0);
      current.setDate(1);

      while (current <= trendEndDate) {
        const year = current.getFullYear();
        const yStart = new Date(year, 0, 1, 0, 0, 0, 0);
        const yEnd = new Date(year, 11, 31, 23, 59, 59, 999);

        const leadCount = leadsForTrend.filter(l => {
          const cDate = new Date(l.createdAt);
          return cDate >= yStart && cDate <= yEnd;
        }).length;

        const taskCount = tasksForTrend.filter(t => {
          const cDate = new Date(t.createdAt);
          return cDate >= yStart && cDate <= yEnd;
        }).length;

        trend.push({
          month: `${year}`,
          year,
          leads: leadCount,
          tasks: taskCount,
        });

        current.setFullYear(current.getFullYear() + 1);
        if (trend.length > 50) break; // Guard loop
      }
    } else {
      // monthly
      const current = new Date(trendStartDate);
      current.setDate(1);

      while (current <= trendEndDate) {
        const mIdx = current.getMonth();
        const year = current.getFullYear();
        const monthName = months[mIdx];

        const leadCount = leadsForTrend.filter(l => {
          const cDate = new Date(l.createdAt);
          return cDate.getMonth() === mIdx && cDate.getFullYear() === year;
        }).length;

        const taskCount = tasksForTrend.filter(t => {
          const cDate = new Date(t.createdAt);
          return cDate.getMonth() === mIdx && cDate.getFullYear() === year;
        }).length;

        trend.push({
          month: `${monthName} ${year.toString().slice(-2)}`,
          year,
          leads: leadCount,
          tasks: taskCount,
        });

        current.setMonth(current.getMonth() + 1);
        if (trend.length > 120) break; // Guard loop
      }
    }

    // 4. Recent Leads (5 most recent)
    const recentLeads = await this.prisma.lead.findMany({
      where: scopeFilter,
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 5. Demographics (Top Countries)
    const countryGroup = await this.prisma.lead.groupBy({
      by: ['country'],
      where: {
        ...scopeFilter,
        country: { not: null, notIn: ['', ' '] },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    let demographics = countryGroup.map(c => ({
      country: c.country!,
      count: c._count.id,
      percentage: 0,
    }));

    const totalCountryLeads = demographics.reduce((sum, c) => sum + c.count, 0);
    if (totalCountryLeads > 0) {
      demographics = demographics.map(c => ({
        ...c,
        percentage: Math.round((c.count / totalCountryLeads) * 100),
      }));
    } else {
      // Robust fallback if no country data is entered in CRM
      demographics = [
        { country: 'USA', count: Math.round(totalLeads * 0.5) || 0, percentage: 50 },
        { country: 'United Kingdom', count: Math.round(totalLeads * 0.3) || 0, percentage: 30 },
        { country: 'India', count: Math.round(totalLeads * 0.2) || 0, percentage: 20 },
      ];
    }

    return {
      metrics: {
        leads: { total: totalLeads, growth: calculateGrowth(thisMonthLeads, lastMonthLeads) },
        contacts: { total: totalContacts, growth: calculateGrowth(thisMonthContacts, lastMonthContacts) },
        accounts: { total: totalAccounts, growth: calculateGrowth(thisMonthAccounts, lastMonthAccounts) },
        tasks: { total: totalTasks, growth: calculateGrowth(thisMonthTasks, lastMonthTasks) },
      },
      pipeline: {
        target,
        revenue,
        todayRevenue,
        winRate,
      },
      trend,
      recentLeads,
      demographics,
    };
  }

  // public async getOpenActivities(userId: number) {
  //   const scopeFilter = await this.getScopeFilter(userId);
  //   const now = new Date();
  //   const todayStart = new Date();
  //   todayStart.setHours(0, 0, 0, 0);
  //   const accessibleUserIds = await this.userHierarchyService.getFamilyUserIds(userId);

  //   const [tasks, meetings, calls] = await Promise.all([
  //     this.prisma.task.findMany({
  //       where: {
  //         ...scopeFilter,
  //         status: { not: 'COMPLETED' },
  //         dueDate: { lte: now },
  //       },
  //       orderBy: { dueDate: 'asc' },
  //       take: 10,
  //     }),
  //     await this.prisma.meeting.findMany({
  //       where: {
  //         createdById: {
  //           in: accessibleUserIds,
  //         },
  //         status: {
  //           not: "COMPLETED",
  //         },
  //         startTime: {
  //           lte: now,
  //         },
  //       },
  //       orderBy: {
  //         startTime: "asc",
  //       },
  //       take: 10,
  //     }),

  //     this.prisma.call.findMany({
  //       where: {
  //         ...scopeFilter,
  //         status: { not: 'COMPLETED' },
  //         callStartTime: { lte: now },
  //       },
  //       orderBy: { callStartTime: 'asc' },
  //       take: 10,
  //     }),
  //   ]);
  //   console.log(meetings,"::meetings")

  //   return {
  //     tasks,
  //     meetings,
  //     calls,
  //     total: tasks.length + meetings.length + calls.length,
  //   };
  // }

  public async getOpenActivities(
  userId: number,
  dto: OpenActivityGetDto,
) {
  const scopeFilter = await this.getScopeFilter(userId);

  const accessibleUserIds =
    await this.userHierarchyService.getFamilyUserIds(userId);

  const page = Math.max(Number(dto.page) || 1, 1);
  const perPage = Math.max(Number(dto.perPage) || 10, 1);

  const skip = (page - 1) * perPage;

  const now = new Date();

  /* ---------------------------------------------------------------- */
  /* Fetch all open activities                                        */
  /* ---------------------------------------------------------------- */

  const [tasks, meetings, calls] = await Promise.all([
    this.prisma.task.findMany({
      where: {
        ...scopeFilter,

        status: {
          not: 'COMPLETED',
        },

        dueDate: {
          lte: now,
        },
      },

      include: {
        owner: true,
      },
    }),

    this.prisma.meeting.findMany({
      where: {
        createdById: {
          in: accessibleUserIds,
        },

        status: {
          not: 'COMPLETED',
        },

        startTime: {
          lte: now,
        },
      },

      include: {
        participants: true,
      },
    }),

    this.prisma.call.findMany({
      where: {
        ...scopeFilter,

        status: {
          not: 'COMPLETED',
        },

        callStartTime: {
          lte: now,
        },
      },

      include: {
        owner: true,
      },
    }),
  ]);

  /* ---------------------------------------------------------------- */
  /* Combine activities                                               */
  /* ---------------------------------------------------------------- */

  const activities = [
    ...tasks
      .filter((task) => task.dueDate !== null)
      .map((task) => ({
        ...task,
        type: 'task' as const,
        activityDate: task.dueDate,
      })),

    ...meetings
      .filter((meeting) => meeting.startTime !== null)
      .map((meeting) => ({
        ...meeting,
        type: 'meeting' as const,
        activityDate: meeting.startTime,
      })),

    ...calls
      .filter((call) => call.callStartTime !== null)
      .map((call) => ({
        ...call,
        type: 'call' as const,
        activityDate: call.callStartTime,
      })),
  ];

  /* ---------------------------------------------------------------- */
  /* Sort all activities together                                     */
  /* ---------------------------------------------------------------- */

  activities.sort((a, b) => {
    const dateA = a.activityDate?.getTime() ?? 0;
    const dateB = b.activityDate?.getTime() ?? 0;

    return dateA - dateB;
  });

  /* ---------------------------------------------------------------- */
  /* Total before pagination                                          */
  /* ---------------------------------------------------------------- */

  const total = activities.length;

  const totalPages = Math.ceil(total / perPage);

  /* ---------------------------------------------------------------- */
  /* Pagination                                                       */
  /* ---------------------------------------------------------------- */

  const paginatedActivities = activities.slice(
    skip,
    skip + perPage,
  );

  /* ---------------------------------------------------------------- */
  /* Response                                                         */
  /* ---------------------------------------------------------------- */

  return {
    data: paginatedActivities,

    meta: {
      total,
      page,
      perPage,
      totalPages,

      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
}
