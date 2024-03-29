import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipService } from '../friendship.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { DataSource } from 'typeorm';
import { config } from '../../config/config';
import { Friendship } from '../entities/friendship.entity';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { User } from '../../user/entities/user.entity';
import { FriendshipStatus } from '../../types';
import { UserHelperService } from '../../user/user-helper.service';
import { v4 as uuid } from 'uuid';
import { Post } from '../../post/entities/post.entity';

const moduleMocker = new ModuleMocker(global);

const userId = uuid();
const friendId = uuid();
const friendshipId = uuid();
const friendshipRevertId = uuid();

const findAllQueryMock = { page: 2, status: [] };
const userMock = new User();
const friendMock = new User();
const friendshipMock = new Friendship();
const friendshipRevertMock = new Friendship();

const userArrAmount = 20;
const userArr = [userMock, userMock, userMock];

let friendshipSaveMock = jest.fn(async () => undefined);
let friendshipRemoveMock = jest.fn(async () => undefined);

describe('FriendService', () => {
  let service: FriendshipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FriendshipService],
    })
      .useMocker((token) => {
        if (token === DataSource) {
          const createQueryBuilder = {
            select: () => createQueryBuilder,
            from: () => createQueryBuilder,
            leftJoin: () => createQueryBuilder,
            addSelect: () => createQueryBuilder,
            orderBy: () => createQueryBuilder,
            where: () => createQueryBuilder,
            orWhere: () => createQueryBuilder,
            andWhere: () => createQueryBuilder,
            skip: () => createQueryBuilder,
            take: () => createQueryBuilder,
            getManyAndCount: async () => [[...userArr], userArrAmount],
          };

          return {
            createQueryBuilder: () => createQueryBuilder,
          };
        }

        if (token === UserHelperService) {
          return {
            filterPublicData: (user: User) => ({
              id: user.id,
            }),
          };
        }

        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    userMock.id = userId;
    friendMock.id = friendId;

    friendshipMock.id = friendshipId;
    friendshipMock.user = userMock;
    friendshipMock.friend = friendMock;
    friendshipMock.status = FriendshipStatus.Accepted;

    friendshipRevertMock.id = friendshipRevertId;
    friendshipRevertMock.user = friendMock;
    friendshipRevertMock.friend = userMock;
    friendshipRevertMock.status = FriendshipStatus.Accepted;

    friendshipSaveMock = jest.fn(async () => undefined);
    friendshipRemoveMock = jest.fn(async () => undefined);

    service = module.get<FriendshipService>(FriendshipService);

    jest.spyOn(Friendship.prototype, 'save').mockImplementation(friendshipSaveMock);
    jest.spyOn(Friendship.prototype, 'remove').mockImplementation(friendshipRemoveMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getFriendship - findOne should call with the appropriate options', async () => {
    const where: any = { id: friendshipId };
    let findOneOptionsMock: any = {};

    jest.spyOn(Friendship, 'findOne').mockImplementation((options: any) => {
      findOneOptionsMock = options;
      return {} as any;
    });

    await service.getFriendship(where);

    expect(findOneOptionsMock.relations.includes('user')).toBe(true);
    expect(findOneOptionsMock.relations.includes('friend')).toBe(true);
    expect(findOneOptionsMock.where).toEqual(where);
  });

  it('findAllByUserId - should throw bad request error if empty id', async () => {
    await expect(async () => service.findAllByUserId('', findAllQueryMock)).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('findAllByUserId - should return the correct data', async () => {
    jest.spyOn(Friendship, 'findAndCount').mockImplementation(async (options: any) => {
      friendshipMock.id = options.where.id;
      return [[friendshipMock, friendshipMock, friendshipMock], 20];
    });

    const result = await service.findAllByUserId(userId, findAllQueryMock);

    expect(result.friends[0].userId).toBe(userId);
    expect(result.friends[0].friend.id).toBe(friendId);
    expect(result.totalFriendsCount).toBe(20);
    expect(result.totalPages).toBe(Math.ceil(20 / config.itemsCountPerPage));
  });

  it('findAllByUserId - Travel.findAndCount should get correct data', async () => {
    const pageNumber = 2;
    let findAndCountOptions: any = {
      where: {},
      relations: [],
      order: {},
    };
    const findAndCountMock = async (options: any): Promise<any> => {
      findAndCountOptions = options;
      return [[], 0];
    };

    jest.spyOn(Friendship, 'findAndCount').mockImplementation(findAndCountMock);

    await service.findAllByUserId(userId, findAllQueryMock);

    expect(findAndCountOptions.relations.includes('user')).toBe(true);
    expect(findAndCountOptions.relations.includes('friend')).toBe(true);
    expect(findAndCountOptions.where).toBeDefined();
    expect(findAndCountOptions.skip).toBe(config.itemsCountPerPage * (pageNumber - 1));
    expect(findAndCountOptions.take).toBe(config.itemsCountPerPage);
  });

  it('invite - should throw bad request error if empty id', async () => {
    await expect(async () => await service.invite('', {} as any)).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('invite - should throw conflict error if friendship exist', async () => {
    jest.spyOn(Friendship, 'count').mockResolvedValue(1);

    await expect(
      async () => await service.invite(userId, { friendId } as any),
    ).rejects.toThrowError(ConflictException);
  });

  it('invite - should throw not found error if user is empty', async () => {
    jest.spyOn(Friendship, 'count').mockResolvedValue(0);
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      if (options.where.id === userId) return null;
      if (options.where.id === friendId) return {} as any;
    });

    await expect(
      async () => await service.invite(userId, { friendId } as any),
    ).rejects.toThrowError(NotFoundException);
  });

  it('invite - should throw not found error if friend is empty', async () => {
    jest.spyOn(Friendship, 'count').mockResolvedValue(0);
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      if (options.where.id === userId) return {} as any;
      if (options.where.id === friendId) return null;
    });

    await expect(
      async () => await service.invite(userId, { friendId } as any),
    ).rejects.toThrowError(NotFoundException);
  });

  it('invite - should return the correct data', async () => {
    jest.spyOn(Friendship, 'count').mockResolvedValue(0);
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      if (options.where.id === userId) return userMock;
      if (options.where.id === friendId) return friendMock;
    });

    const result = await service.invite(userId, { friendId });

    expect(result).toEqual({
      id: undefined,
      userId,
      friend: { id: friendId },
      status: FriendshipStatus.Waiting,
    });
  });

  it('invite - should update record in database', async () => {
    await service.invite(userId, { friendId });

    expect(friendshipSaveMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('accept - should throw bad request error if empty id', async () => {
    await expect(async () => await service.accept('')).rejects.toThrowError(BadRequestException);
  });

  it('accept - should throw not found error if friendship dont exist', async () => {
    jest.spyOn(Friendship, 'findOne').mockResolvedValue(null);
    await expect(async () => await service.accept(userId)).rejects.toThrowError(NotFoundException);
  });

  it('accept - should return the correct data', async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendshipTwoSides').mockResolvedValueOnce({
      friendship: friendshipMock,
      friendshipRevert: friendshipRevertMock,
    });

    const result = await service.accept(userId);

    expect(result).toEqual({
      id: friendshipId,
      userId,
      friend: { id: friendId },
      status: FriendshipStatus.Accepted,
    });
  });

  it('accept - should update record in database', async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendshipTwoSides').mockResolvedValueOnce({
      friendship: friendshipMock,
      friendshipRevert: friendshipRevertMock,
    });

    await service.accept(friendshipId);

    expect(friendshipSaveMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('remove - should throw bad request error', async () => {
    await expect(async () => service.remove('')).rejects.toThrowError(BadRequestException);
  });

  it('remove - should throw not found error', async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendshipTwoSides').mockResolvedValueOnce(null);

    await expect(async () => service.remove(friendshipId)).rejects.toThrowError(NotFoundException);
  });

  it('remove - should return the correct data', async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendshipTwoSides').mockResolvedValueOnce({
      friendship: friendshipMock,
      friendshipRevert: friendshipRevertMock,
    });

    const result = await service.remove(userId);

    expect(result).toEqual({
      id: friendshipId,
      userId,
      friend: { id: friendId },
      status: FriendshipStatus.Accepted,
    });
  });

  it('remove - should remove record from database', async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendshipTwoSides').mockResolvedValueOnce({
      friendship: friendshipMock,
      friendshipRevert: friendshipRevertMock,
    });

    await service.remove(friendshipId);

    expect(friendshipRemoveMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('checkFriendshipExist - should throw error if userId is empty', async () => {
    await expect(async () => service.checkFriendshipExist('', friendId)).rejects.toThrowError(
      'userId or friendId is empty',
    );
  });

  it('checkFriendshipExist - should throw error if friendId is empty', async () => {
    await expect(async () => service.checkFriendshipExist(userId, '')).rejects.toThrowError(
      'userId or friendId is empty',
    );
  });

  it('checkFriendshipExist - should throw error if friendId and userId is empty', async () => {
    await expect(async () => service.checkFriendshipExist('', '')).rejects.toThrowError(
      'userId or friendId is empty',
    );
  });

  it('checkFriendshipExist - count should call with the appropriate options', async () => {
    let countOptionsMock: any = {};

    jest.spyOn(Friendship, 'count').mockImplementation(async (options: any) => {
      countOptionsMock = options;
      return 2;
    });

    await service.checkFriendshipExist(userId, friendId);

    expect(countOptionsMock.where).toEqual({
      user: { id: userId },
      friend: { id: friendId },
    });
  });

  it('checkFriendshipExist - should return boolean value(true)', async () => {
    jest.spyOn(Friendship, 'count').mockResolvedValue(2);

    const result = await service.checkFriendshipExist(userId, friendId);

    expect(result).toBe(true);
  });

  it('checkFriendshipExist - should return boolean value(false)', async () => {
    jest.spyOn(Friendship, 'count').mockResolvedValue(0);

    const result = await service.checkFriendshipExist(userId, friendId);

    expect(result).toBe(false);
  });

  it('checkFriendshipExistAndThrow - should throw conflict error', async () => {
    jest.spyOn(FriendshipService.prototype, 'checkFriendshipExist').mockResolvedValue(true);

    await expect(async () =>
      service.checkFriendshipExistAndThrow(userId, friendId),
    ).rejects.toThrowError(ConflictException);
  });

  it("checkFriendshipExistAndThrow - shouldn't throw conflict error", async () => {
    jest.spyOn(FriendshipService.prototype, 'checkFriendshipExist').mockResolvedValue(false);

    const result = await service.checkFriendshipExistAndThrow(userId, friendId);

    expect(result).not.toBeDefined();
  });

  it('searchNewFriends - should throw bad request error if id is empty', async () => {
    await expect(async () =>
      service.searchNewFriends('', { page: 1, search: '' }),
    ).rejects.toThrowError(BadRequestException);
  });

  it('searchNewFriends - should return empty data if search is empty', async () => {
    const result = await service.searchNewFriends(userId, { page: 1, search: '' });

    expect(result).toEqual({
      users: [],
      totalPages: 0,
      totalUsersCount: 0,
    });
  });

  it('searchNewFriends - should return correct data', async () => {
    const result = await service.searchNewFriends(userId, { page: 1, search: 'abc' });

    expect(result).toEqual({
      users: [...userArr],
      totalPages: Math.ceil(userArrAmount / config.itemsCountPerPage),
      totalUsersCount: userArrAmount,
    });
  });

  it('getFriendshipTwoSidesByIds - should throw error if userId is empty', async () => {
    await expect(async () => service.getFriendshipTwoSidesByIds('', friendId)).rejects.toThrowError(
      'userId or friendId is empty',
    );
  });

  it('getFriendshipTwoSidesByIds - should throw error if friendId is empty', async () => {
    await expect(async () => service.getFriendshipTwoSidesByIds(userId, '')).rejects.toThrowError(
      'userId or friendId is empty',
    );
  });

  it('getFriendshipTwoSidesByIds - should throw error if userId and friendId is empty', async () => {
    await expect(async () => service.getFriendshipTwoSidesByIds('', '')).rejects.toThrowError(
      'userId or friendId is empty',
    );
  });

  it('getFriendshipTwoSidesByIds - should throw error if friendship is incomplete', async () => {
    jest
      .spyOn(FriendshipService.prototype, 'getFriendship')
      .mockImplementation(async (where: any) => {
        if (where.friend?.id === userId && where.user?.id === friendId) {
          return friendshipRevertMock;
        }
        return null;
      });

    await expect(async () =>
      service.getFriendshipTwoSidesByIds(userId, friendId),
    ).rejects.toThrowError(`incomplete friendship ${undefined} - ${friendshipRevertId}`);
  });

  it('getFriendshipTwoSidesByIds - should throw error if friendship is incomplete(revert)', async () => {
    jest
      .spyOn(FriendshipService.prototype, 'getFriendship')
      .mockImplementation(async (where: any) => {
        if (where.user?.id === userId && where.friend?.id === friendId) return friendshipMock;
        return null;
      });

    await expect(async () =>
      service.getFriendshipTwoSidesByIds(userId, friendId),
    ).rejects.toThrowError(`incomplete friendship ${friendshipId} - ${undefined}`);
  });

  it("getFriendshipTwoSidesByIds - should return null if friendship doesn't exist", async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendship').mockResolvedValue(null);

    const result = await service.getFriendshipTwoSidesByIds(userId, friendId);

    expect(result).toBeNull();
  });

  it('getFriendshipTwoSidesByIds - should return correct two sides of friendships', async () => {
    jest
      .spyOn(FriendshipService.prototype, 'getFriendship')
      .mockImplementation(async (where: any) => {
        if (where.user?.id === userId && where.friend?.id === friendId) return friendshipMock;
        if (where.friend?.id === userId && where.user?.id === friendId) return friendshipRevertMock;
        return null;
      });

    const result = await service.getFriendshipTwoSidesByIds(userId, friendId);

    expect(result).toEqual({ friendship: friendshipMock, friendshipRevert: friendshipRevertMock });
  });

  it('getFriendshipTwoSides - should return null if friendship is null', async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendship').mockResolvedValue(null);

    const result = await service.getFriendshipTwoSides({});

    expect(result).toBeNull();
  });

  it('getFriendshipTwoSides - should return null if user is null', async () => {
    friendshipMock.user = undefined;
    jest.spyOn(FriendshipService.prototype, 'getFriendship').mockResolvedValue(friendshipMock);

    const result = await service.getFriendshipTwoSides({});

    expect(result).toBeNull();
  });

  it('getFriendshipTwoSides - should return null if friend is null', async () => {
    friendshipMock.friend = undefined;
    jest.spyOn(FriendshipService.prototype, 'getFriendship').mockResolvedValue(friendshipMock);

    const result = await service.getFriendshipTwoSides({});

    expect(result).toBeNull();
  });

  it('getFriendshipTwoSides - should return null if friend and user is null', async () => {
    friendshipMock.user = undefined;
    friendshipMock.friend = undefined;
    jest.spyOn(FriendshipService.prototype, 'getFriendship').mockResolvedValue(friendshipMock);

    const result = await service.getFriendshipTwoSides({});

    expect(result).toBeNull();
  });

  it('filter - should return save data', () => {
    const { user, friend, ...friendshipResponse } = friendshipMock;

    expect(service.filter(friendshipMock)).toEqual({
      ...friendshipResponse,
      userId: user.id,
      friend: friend,
    });
  });
});
