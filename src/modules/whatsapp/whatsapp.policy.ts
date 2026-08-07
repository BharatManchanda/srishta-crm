import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WHATSAPP_MODULE_ID } from 'src/seeders/module.seeder';

@Injectable()
export class WhatsappPolicy {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async hasWhatsappAccess(roleId: number) {
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        moduleId: WHATSAPP_MODULE_ID,
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
    return actions.includes("Whatsapp Access");
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

  async canAccessWhatsapp(currentUser:any){
    return this.hasWhatsappAccess(currentUser.roleId);
  }
  async authorizeWhatsapp(currentUser:any){
    const allowed = await this.canAccessWhatsapp(currentUser);
    if(!allowed){
      throw new ForbiddenException('You do not have access to Whatsapp');
    }
    return true;
  }

  async getLeadScope(currentUser:any){
    return this.getAccessibleUserIds(
      currentUser.id
    );
  }
}