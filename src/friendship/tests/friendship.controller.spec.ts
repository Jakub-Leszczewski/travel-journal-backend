import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipController } from '../friendship.controller';
import { FriendshipService } from '../friendship.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { v4 as uuid } from 'uuid';

const moduleMocker = new ModuleMocker(global);

const acceptResult = 'accept';
const removeResult = 'remove';

const friendshipId = uuid();

describe('FriendController', () => {
  let controller: FriendshipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendshipController],
    })
      .useMocker((token) => {
        if (token === FriendshipService) {
          return {
            accept: jest.fn(async (id) => ({ id, result: acceptResult })),
            remove: jest.fn(async (id) => ({ id, result: removeResult })),
          };
        }
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

  it('accept - should calls to friendshipService.accept', async () => {
    const result: any = await controller.accept(friendshipId);

    expect(result.result).toBe(acceptResult);
    expect(result.id).toEqual(friendshipId);
  });

  it('remove - should calls to friendshipService.remove', async () => {
    const result: any = await controller.remove(friendshipId);

    expect(result.result).toBe(removeResult);
    expect(result.id).toEqual(friendshipId);
  });
});
