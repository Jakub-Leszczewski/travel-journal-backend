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

const userId = uuid();
const friendId = uuid();
const friendshipId = uuid();
const friendshipRevertId = uuid();
const findAllQueryMock = { page: 2, status: [] };
const userMock = new User();
const friendMock = new User();
const friendshipMock = new Friendship();
const friendshipRevertMock = new Friendship();

const moduleMocker = new ModuleMocker(global);

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
            skip: () => createQueryBuilder,
            take: () => createQueryBuilder,
            // getManyAndCount: async () => [postsArr, postsArr.length],
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

    service = module.get<FriendshipService>(FriendshipService);

    jest.spyOn(Friendship.prototype, 'save').mockResolvedValue(undefined);
    jest.spyOn(Friendship.prototype, 'remove').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

  it('accept - should throw bad request error if empty id', async () => {
    await expect(async () => await service.accept('')).rejects.toThrowError(BadRequestException);
  });

  it('accept - should throw not found error if friendship dont exist', async () => {
    jest.spyOn(Friendship, 'findOne').mockResolvedValue(null);
    await expect(async () => await service.accept(userId)).rejects.toThrowError(NotFoundException);
  });

  it('accept - should return the correct data', async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendshipTwoSides').mockResolvedValue({
      friendshipUser: friendshipMock,
      friendshipFriend: friendshipRevertMock,
    });

    const result = await service.accept(userId);

    expect(result).toEqual({
      id: friendshipId,
      userId,
      friend: { id: friendId },
      status: FriendshipStatus.Accepted,
    });
  });

  it('remove - should throw bad request error', async () => {
    await expect(async () => service.remove('')).rejects.toThrowError(BadRequestException);
  });

  it('remove - should throw not found error', async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendshipTwoSides').mockResolvedValue(null);

    await expect(async () => service.remove(friendshipId)).rejects.toThrowError(NotFoundException);
  });

  it('remove - should return the correct data', async () => {
    jest.spyOn(FriendshipService.prototype, 'getFriendshipTwoSides').mockResolvedValue({
      friendshipUser: friendshipMock,
      friendshipFriend: friendshipRevertMock,
    });

    const result = await service.remove(userId);

    expect(result).toEqual({
      id: friendshipId,
      userId,
      friend: { id: friendId },
      status: FriendshipStatus.Accepted,
    });
  });
});
