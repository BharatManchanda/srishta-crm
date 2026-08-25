import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FACEBOOK_AND_INSTAGRAM_ADS_MODULE_ID } from 'src/seeders/module.seeder';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class FacebookPolicy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private async hasFacebookAccess(currentUser: any) {
    const isAllow = await this.paymentsService.isAllowedModules(currentUser.id, FACEBOOK_AND_INSTAGRAM_ADS_MODULE_ID);
    if (!isAllow) {
      throw new ForbiddenException(`You are not allowed to access Facebook & Instagram Ads`);
    }
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: currentUser.roleId,
        moduleId: FACEBOOK_AND_INSTAGRAM_ADS_MODULE_ID,
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
    return actions.includes("Facebook & Instagram Ads");
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

  async canAccessFacebook(currentUser:any){
    return this.hasFacebookAccess(currentUser);
  }
  async authorizeFacebook(currentUser:any){
    const allowed = await this.canAccessFacebook(currentUser);
    if(!allowed){
      throw new ForbiddenException('You do not have access to Facebook');
    }
    return true;
  }

  async getLeadScope(currentUser:any){
    return this.getAccessibleUserIds(
      currentUser.id
    );
  }
}