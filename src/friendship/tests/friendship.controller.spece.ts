import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipController } from '../friendship.controller';
import { FriendshipService } from '../friendship.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('FriendController', () => {
  let controller: FriendshipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendshipController],
      providers: [FriendshipService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = module.get<FriendshipController>(FriendshipController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
