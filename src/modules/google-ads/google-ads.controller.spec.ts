import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAdsController } from './google-ads.controller';

describe('GoogleAdsController', () => {
  let controller: GoogleAdsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleAdsController],
    }).compile();

    controller = module.get<GoogleAdsController>(GoogleAdsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
