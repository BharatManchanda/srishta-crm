import { Injectable } from '@nestjs/common';
import { UserStatus, LeadSource, LeadStatus, LeadPriority, LeadRating } from '@prisma/client';

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
            }
        };
    }
}
