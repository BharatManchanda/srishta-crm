import { Injectable } from '@nestjs/common';
import {
  UserStatus,
  LeadSource,
  LeadStatus,
  LeadPriority,
  LeadRating,
  AccountType,
  AccountRating,
  OwnershipType,
} from '@prisma/client';

@Injectable()
export class MasterDataService {
  constructor() {}

  getList() {
    return {
      data: {
        userStatus: UserStatus,
        leadSource: LeadSource,
        leadStatus: LeadStatus,
        leadPriority: LeadPriority,
        leadRating: LeadRating,
        accountType: AccountType,
        accountRating: AccountRating,
        ownershipType: OwnershipType,
      },
    };
  }
}
