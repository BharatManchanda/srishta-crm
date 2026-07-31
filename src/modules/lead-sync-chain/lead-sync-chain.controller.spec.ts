import { Test, TestingModule } from '@nestjs/testing';
import { LeadSyncChainController } from './lead-sync-chain.controller';

describe('LeadSyncChainController', () => {
  let controller: LeadSyncChainController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadSyncChainController],
    }).compile();

    controller = module.get<LeadSyncChainController>(LeadSyncChainController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
