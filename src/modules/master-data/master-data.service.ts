import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

@Injectable()
export class MasterDataService {
    constructor() {}

    getList() {
        return {
            data: {
                userStatus : UserStatus
            }
        };
    }
}
