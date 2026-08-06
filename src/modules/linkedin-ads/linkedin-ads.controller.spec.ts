import { Test, TestingModule } from '@nestjs/testing';
import { LinkedinAdsController } from './linkedin-ads.controller';

describe('LinkedinAdsController', () => {
  let controller: LinkedinAdsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkedinAdsController],
    }).compile();

    controller = module.get<LinkedinAdsController>(LinkedinAdsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
