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
  PriorityType,
  TaskStatus,
  CallEntityType,
  MeetingEntityType,
  MeetingParticipantType,
  MeetingStatus,
  MeetingResponseStatus,
  CallStatus,
  CallResult,
  CallPurpose,
  AccessLevel,
} from '@prisma/client';

@Injectable()
export class MasterDataService {
  constructor() {}

  getList() {
    return {
      data: {
        userStatus: UserStatus,
        userAccessLevel: AccessLevel,
        leadSource: LeadSource,
        leadStatus: LeadStatus,
        leadPriority: LeadPriority,
        leadRating: LeadRating,
        accountType: AccountType,
        accountRating: AccountRating,
        ownershipType: OwnershipType,
        priorityType: PriorityType,
        taskStatus: TaskStatus,
        callEntityType: CallEntityType,
        meetingEntityType: MeetingEntityType,
        meetingParticipantType: MeetingParticipantType,
        meetingStatus: MeetingStatus,
        meetingResponseStatus: MeetingResponseStatus,
        callStatus: CallStatus,
        callResult: CallResult,
        callPurpose: CallPurpose,
      },
    };
  }
}
