import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GOOGLE_MODULE_ID } from 'src/seeders/module.seeder';

@Injectable()
export class GoogleCalendarPolicy {
  constructor(private readonly prisma: PrismaService) {}

  private async hasGoogleCalendarAccess(roleId: number) {
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        moduleId: GOOGLE_MODULE_ID,
        isAllow: true,
      },
      select: {
        actions: true,
      },
    });

    if (!permission?.actions) {
      return false;
    }

    const actions = permission.actions as string[];
    return actions.includes("Google Calendar");
  }

  private async getRootUserId(userId: number): Promise<number> {
    let user = await this.prisma.user.findUnique({
      where:{
        id:userId
      },
      select:{
        id:true,
        parentId:true
      }
    });

    while(user?.parentId){
      user = await this.prisma.user.findUnique({
        where:{
          id:user.parentId
        },
        select:{
          id:true,
          parentId:true
        }
      });
    }
    return user!.id;
  }

  private async getAccessibleUserIds(userId:number){
    const rootId = await this.getRootUserId(userId);
    const users = await this.prisma.user.findMany({
      select:{
        id:true,
        parentId:true
      }
    });

    const allowedIds=[rootId];

    const collectChildren=(parentId:number)=>{
      const children = users.filter(
        user=>user.parentId===parentId
      );

      for(const child of children){
        allowedIds.push(child.id);
        collectChildren(child.id);
      }
    };

    collectChildren(rootId);

    return [...new Set(allowedIds)];
  }

  async canAccessGoogleCalendar(currentUser:any){
    return this.hasGoogleCalendarAccess(currentUser.roleId);
  }
  async authorizeGoogleCalendar(currentUser:any){
    const allowed = await this.canAccessGoogleCalendar(currentUser);
    if(!allowed){
      throw new ForbiddenException('You do not have access to Google Calendar');
    }
    return true;
  }

  async getLeadScope(currentUser:any){
    return this.getAccessibleUserIds(
      currentUser.id
    );
  }
}