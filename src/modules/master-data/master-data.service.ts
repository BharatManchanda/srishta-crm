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
import { ACCOUNT_MODULE_ID, ATTACHMENT_MODULE_ID, CALL_MODULE_ID, CONTACT_MODULE_ID, DASHBOARD_MODULE_ID, EMAIL_MODULE_ID, FACEBOOK_AND_INSTAGRAM_ADS_MODULE_ID, GOOGLE_MODULE_ID, IMPORT_MODULE_ID, LEAD_MODULE_ID, LINKEDIN_MODULE_ID, MEETING_MODULE_ID, NOTE_MODULE_ID, ROLE_CONFIG_MODULE_ID, SETTINGS_MODULE_ID, TASK_MODULE_ID, USER_MODULE_ID, WHATSAPP_MODULE_ID } from 'src/seeders/module.seeder';

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
        moduleIds: {
          DASHBOARD_MODULE_ID,
          USER_MODULE_ID,
          LEAD_MODULE_ID,
          SETTINGS_MODULE_ID,
          CONTACT_MODULE_ID,
          ACCOUNT_MODULE_ID,
          NOTE_MODULE_ID,
          ATTACHMENT_MODULE_ID,
          TASK_MODULE_ID,
          CALL_MODULE_ID,
          MEETING_MODULE_ID,
          IMPORT_MODULE_ID,
          EMAIL_MODULE_ID,
          WHATSAPP_MODULE_ID,
          GOOGLE_MODULE_ID,
          LINKEDIN_MODULE_ID,
          FACEBOOK_AND_INSTAGRAM_ADS_MODULE_ID,
          ROLE_CONFIG_MODULE_ID,
        },
      },
    };
  }
}
