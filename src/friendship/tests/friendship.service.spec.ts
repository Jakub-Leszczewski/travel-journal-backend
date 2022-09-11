import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipService } from '../friendship.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { DataSource } from 'typeorm';
import { config } from '../../config/config';
import { Friendship } from '../entities/friendship.entity';
import { BadRequestException } from '@nestjs/common';
import { User } from '../../user/entities/user.entity';
import { FriendshipStatus } from '../../types';
import { UserHelperService } from '../../user/user-helper.service';

const userId = 'abc';
const friendId = 'abc';
const friendshipId = 'xyz';
const findAllQueryMock = { page: 2, status: [] };
const userMock = new User();
const friendMock = new User();
const friendshipMock = new Friendship();

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
    friendshipMock.friend = userMock;
    friendshipMock.status = FriendshipStatus.Accepted;

    service = module.get<FriendshipService>(FriendshipService);
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
});
