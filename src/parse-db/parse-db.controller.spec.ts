import { Test, TestingModule } from '@nestjs/testing';
import { ParseDbController } from './parse-db.controller';

describe('ParseDbController', () => {
  let controller: ParseDbController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParseDbController],
    }).compile();

    controller = module.get<ParseDbController>(ParseDbController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
