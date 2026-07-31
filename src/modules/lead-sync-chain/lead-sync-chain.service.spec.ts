import { Test, TestingModule } from '@nestjs/testing';
import { LeadSyncChainService } from './lead-sync-chain.service';

describe('LeadSyncChainService', () => {
  let service: LeadSyncChainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadSyncChainService],
    }).compile();

    service = module.get<LeadSyncChainService>(LeadSyncChainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
