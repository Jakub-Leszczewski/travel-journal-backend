import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { v4 as uuid } from 'uuid';
import { TravelService } from '../../travel/travel.service';
import { FriendshipService } from '../../friendship/friendship.service';

const moduleMocker = new ModuleMocker(global);

const createResult = 'create';
const findOneResult = 'findOne';
const getIndexResult = 'getIndex';
const searchNewFriendsResult = 'searchNewFriends';
const removeResult = 'remove';
const updateResult = 'update';
const getStatsResult = 'getStats';
const getPhotoResult = 'getPhoto';
const findAllTravelResult = 'findAllTravel';
const createTravelResult = 'createTravel';
const inviteFriendResult = 'inviteFriend';
const getAllFriendshipByUserIdResult = 'getAllFriendshipByUserId';

const userId = uuid();
const fileMock: any = { multer: true };
const bodyMock: any = { body: true };
const queryMock: any = { query: true };

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
    })
      .useMocker((token) => {
        if (token === UserService) {
          return {
            create: jest.fn(async (body, file) => ({ body, file, result: createResult })),
            findOne: jest.fn((id) => ({ id, result: findOneResult })),
            getUserIndex: jest.fn((id, query) => ({ id, query, result: getIndexResult })),
            remove: jest.fn((id) => ({ id, result: removeResult })),
            update: jest.fn((id, body, file) => ({ id, body, file, result: updateResult })),
            getStats: jest.fn((id) => ({ id, result: getStatsResult })),
            getPhoto: jest.fn((id) => ({ id, result: getPhotoResult })),
            createFriendship: jest.fn((id, body) => ({
              id,
              body,
              result: inviteFriendResult,
            })),
            getAllFriendshipByUserId: jest.fn((id, query) => ({
              id,
              query,
              result: getAllFriendshipByUserIdResult,
            })),
          };
        }

        if (token === TravelService) {
          return {
            findAllByUserId: jest.fn((id, query) => ({ id, query, result: findAllTravelResult })),
            create: jest.fn((id, body, file) => ({
              id,
              body,
              file,
              result: createTravelResult,
            })),
          };
        }

        if (token === FriendshipService) {
          return {
            searchNewFriends: jest.fn((id, query) => ({
              id,
              query,
              result: searchNewFriendsResult,
            })),
            invite: jest.fn((id, body) => ({
              id,
              body,
              result: inviteFriendResult,
            })),
            findAllByUserId: jest.fn((id, query) => ({
              id,
              query,
              result: getAllFriendshipByUserIdResult,
            })),
          };
        }

        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create - should calls to userService.create', async () => {
    const result: any = await controller.create(bodyMock, fileMock);

    expect(result.result).toBe(createResult);
    expect(result.body).toEqual(bodyMock);
    expect(result.file).toEqual(fileMock);
  });

  it('findOne - should calls to userService.findOne', async () => {
    const result: any = await controller.findOne(userId);

    expect(result.result).toBe(findOneResult);
    expect(result.id).toBe(userId);
  });

  it('getUserIndex - should calls to userService.getUserIndex', async () => {
    const result: any = await controller.getUserIndex(userId, queryMock);

    expect(result.result).toBe(getIndexResult);
    expect(result.id).toBe(userId);
    expect(result.query).toEqual(queryMock);
  });

  it('searchNewFriends - should calls to friendService.searchNewFriends', async () => {
    const result: any = await controller.searchNewFriends(userId, queryMock);

    expect(result.result).toBe(searchNewFriendsResult);
    expect(result.id).toBe(userId);
    expect(result.query).toEqual(queryMock);
  });

  it('remove - should calls to userService.remove', async () => {
    const result: any = await controller.remove(userId);

    expect(result.result).toBe(removeResult);
    expect(result.id).toBe(userId);
  });

  it('update - should calls to userService.update', async () => {
    const result: any = await controller.update(userId, bodyMock, fileMock);

    expect(result.result).toBe(updateResult);
    expect(result.id).toBe(userId);
    expect(result.body).toBe(bodyMock);
    expect(result.file).toBe(fileMock);
  });

  it('getStats - should calls to userService.getStats', async () => {
    const result: any = await controller.getStats(userId);

    expect(result.result).toBe(getStatsResult);
    expect(result.id).toBe(userId);
  });

  it('getPhoto - should calls to userService.getPhoto', async () => {
    const result: any = await controller.getPhoto(userId);

    expect(result.result).toBe(getPhotoResult);
    expect(result.id).toBe(userId);
  });

  it('findAllTravel - should calls to travelService.findAllByUserId', async () => {
    const result: any = await controller.findAllTravel(userId, queryMock);

    expect(result.result).toBe(findAllTravelResult);
    expect(result.id).toBe(userId);
    expect(result.query).toBe(queryMock);
  });

  it('createTravel - should calls to travelService.create', async () => {
    const result: any = await controller.createTravel(userId, bodyMock, fileMock);

    expect(result.result).toBe(createTravelResult);
    expect(result.id).toBe(userId);
    expect(result.body).toBe(bodyMock);
    expect(result.file).toBe(fileMock);
  });

  it('createFriendship - should calls to friendService.invite', async () => {
    const result: any = await controller.inviteFriend(userId, bodyMock);

    expect(result.result).toBe(inviteFriendResult);
    expect(result.id).toBe(userId);
    expect(result.body).toBe(bodyMock);
  });

  it('getAllFriendshipByUserId - should calls to friendService.findAllByUserId', async () => {
    const result: any = await controller.getAllFriendshipByUserId(userId, queryMock);

    expect(result.result).toBe(getAllFriendshipByUserIdResult);
    expect(result.id).toBe(userId);
    expect(result.query).toBe(queryMock);
  });
});
