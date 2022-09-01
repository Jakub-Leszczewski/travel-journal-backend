import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { DataSource } from 'typeorm';
import { PostService } from '../post/post.service';
import { config } from '../config/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserHelperService } from './user-helper.service';
import { FileManagementUser } from '../common/utils/file-management/file-management-user';
import { TravelService } from '../travel/travel.service';

const moduleMocker = new ModuleMocker(global);
const ownerId = 'abc';
const postsArr = [
  { user: { id: ownerId } },
  { user: { id: ownerId } },
  { user: { id: ownerId } },
  { user: { id: ownerId } },
];

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
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
            getManyAndCount: async () => [postsArr, postsArr.length],
          };

          return {
            createQueryBuilder: () => createQueryBuilder,
          };
        } else if (token === PostService) {
          return {
            filterForeignPost(travel) {
              return { user: { id: travel.user.id } };
            },
            async getCountByUserId() {
              return 1;
            },
          };
        } else if (token === TravelService) {
          return {
            async getCountByUserId() {
              return 2;
            },
          };
        } else if (token === UserHelperService) {
          return {
            filter(user: User) {
              return {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
              };
            },
            checkUserFieldUniquenessAndThrow: async (data) => {
              if (data?.username === 'abc' || data?.email === 'abc') throw new ConflictException();
            },
          };
        } else if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<UserService>(UserService);
    jest.spyOn(FileManagementUser, 'removeUserPhoto').mockReturnValue(undefined);
    jest.spyOn(FileManagementUser, 'saveUserPhoto').mockReturnValue({ filename: 'xyz' } as any);
    jest.spyOn(FileManagementUser, 'removeFromTmp').mockReturnValue(undefined);
    jest.spyOn(FileManagementUser, 'removeUserDir').mockReturnValue(undefined);
    jest.spyOn(User.prototype, 'save').mockResolvedValue(undefined);
    jest.spyOn(User.prototype, 'remove').mockResolvedValue(undefined);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('should return index page data', async () => {
    const data = await service.getUserIndex('abc', 1);

    expect(data.posts.length).toBe(postsArr.length);
    expect(data.posts[0].user.id).toBe(ownerId);
    expect(data.totalPages).toBe(Math.ceil(data.posts.length / config.itemsCountPerPage));
    expect(data.totalPostsCount).toBe(postsArr.length);
  });

  it('if id is empty should throw bad request error', async () => {
    await expect(async () => service.getUserIndex('')).rejects.toThrowError(BadRequestException);
  });

  it('findOne should throw bad request error if id is empty', async () => {
    await expect(async () => service.findOne('')).rejects.toThrowError(BadRequestException);
  });

  it('findOne should return data', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.id;

      return user;
    });
    const result = await service.findOne('abc');

    expect(result).toBeDefined();
    expect(result.id).toBe('abc');
  });

  it('findOne should throw not found error', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    await expect(async () => service.findOne('abc')).rejects.toThrowError(NotFoundException);
  });

  it('create should throw conflict username error', () => {
    expect(async () =>
      service.create({ username: 'abc', email: 'xyz' } as any, {} as any),
    ).rejects.toThrowError(ConflictException);
  });

  it('create should throw conflict email error', () => {
    expect(async () =>
      service.create({ username: 'xyz', email: 'abc' } as any, {} as any),
    ).rejects.toThrowError(ConflictException);
  });

  it('create should return new user', async () => {
    const result = await service.create(
      { username: 'xyz', email: 'xyz', password: 'abc' } as any,
      { filename: 'xyz' } as any,
    );
    expect(result).toBeDefined();
  });

  it('update should throw bad request error', async () => {
    await expect(async () => service.update('', {} as any, {} as any)).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('update should throw not found error', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    await expect(async () => service.update('abc', {} as any, {} as any)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('update should change name', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => {
      const user = new User();
      user.firstName = 'aaa';
      user.lastName = 'aaa';
      user.bio = 'aaa';
      return user;
    });

    const newData = {
      firstName: 'bbb',
      lastName: 'bbb',
    };
    const result = await service.update('abc', newData as any, {} as any);

    expect(result).toEqual({ ...newData, bio: 'aaa' });
  });

  it('update should change bio', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => {
      const user = new User();
      user.firstName = 'aaa';
      user.lastName = 'aaa';
      user.bio = 'aaa';
      return user;
    });

    const newData = {
      bio: 'bbb',
    };
    const result = await service.update('abc', newData as any, {} as any);

    expect(result).toEqual({ ...newData, lastName: 'aaa', firstName: 'aaa' });
  });

  it('update should throw unauthorized while password is bad', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => {
      const user = new User();
      user.hashPwd = '$2a$13$BJc7CYyfTDtrWkKV2WTBuuAR1CmrvGwLZjPN8BVkn30eztsAJC9pe'; // Haslo123
      return user;
    });

    await expect(
      async () =>
        await service.update(
          'abc',
          { password: 'Haslo1234', newPassword: 'Haslo1234' } as any,
          {} as any,
        ),
    ).rejects.toThrowError(UnauthorizedException);
  });

  it('update should change password', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => {
      const user = new User();
      user.hashPwd = '$2a$13$BJc7CYyfTDtrWkKV2WTBuuAR1CmrvGwLZjPN8BVkn30eztsAJC9pe'; // Haslo123
      return user;
    });

    const result = await service.update(
      'abc',
      { password: 'Haslo123', newPassword: 'Haslo1234' } as any,
      {} as any,
    );

    await expect(result).toBeDefined();
  });

  it('remove should throw bad request error', async () => {
    await expect(async () => service.remove('')).rejects.toThrowError(BadRequestException);
  });

  it('remove should throw not found error', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue(null);
    await expect(async () => service.remove('abc')).rejects.toThrowError(NotFoundException);
  });

  it('remove should return user', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async () => {
      const user = new User();
      user.id = 'abc';
      return user;
    });

    const result = await service.remove('abc');
    expect(result).toBeDefined();
  });

  it('getStats should throw bad request error', async () => {
    await expect(async () => service.getStats('')).rejects.toThrowError(BadRequestException);
  });

  it('getStats should return data', async () => {
    const result = await service.getStats('abc');
    expect(result).toEqual({
      travelCount: 2,
      postCount: 1,
    });
  });

  it('getPhoto should throw bad request error', async () => {
    await expect(async () => service.getPhoto('')).rejects.toThrowError(BadRequestException);
  });

  it('getPhoto should throw not found error', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue(null);
    await expect(async () => service.getPhoto('abc')).rejects.toThrowError(NotFoundException);
  });
});
