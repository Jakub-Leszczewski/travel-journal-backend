import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { DataSource } from 'typeorm';
import { PostService } from '../../post/post.service';
import { config } from '../../config/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserHelperService } from '../user-helper.service';
import { FileManagementUser } from '../../common/utils/file-management/file-management-user';
import { TravelService } from '../../travel/travel.service';
import { v4 as uuid } from 'uuid';

const moduleMocker = new ModuleMocker(global);
let removeFromTmpMock = jest.fn(async () => undefined);
const userId = uuid();
const multerFileMock: any = { filename: `${userId}.png` };
const newUserDtoMock: any = { username: 'xyz', email: 'xyz', password: 'abc' };
const newPasswordDtoMock: any = { password: 'Password1234', newPassword: 'Password1234' };
const userMock = new User();
const postArrAmount = 20;
const postsArr = [{ user: { id: userId } }, { user: { id: userId } }, { user: { id: userId } }];

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
            getManyAndCount: async () => [postsArr, postArrAmount],
          };

          return {
            createQueryBuilder: () => createQueryBuilder,
          };
        }

        if (token === PostService) {
          return {
            filterForeignPost(travel) {
              return { user: { id: travel.user.id } };
            },
            async getCountByUserId() {
              return 1;
            },
          };
        }

        if (token === TravelService) {
          return {
            async getCountByUserId() {
              return 2;
            },
          };
        }

        if (token === UserHelperService) {
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

    userMock.id = userId;
    userMock.username = 'abc';
    userMock.email = 'abc';
    userMock.bio = 'abc';
    userMock.hashPwd = '$2a$13$Iwf5vi4HLT8GMHysIbbEH.DjVgeC/8O.VJj/o0gJtqB2S9tKhvnP6'; // Password1234

    removeFromTmpMock = jest.fn(async () => undefined);

    jest.spyOn(FileManagementUser, 'removeUserPhoto').mockResolvedValue(undefined);
    jest.spyOn(FileManagementUser, 'saveUserPhoto').mockResolvedValue({ filename: 'xyz' } as any);
    jest.spyOn(FileManagementUser, 'removeFromTmp').mockImplementation(removeFromTmpMock);
    jest.spyOn(FileManagementUser, 'removeUserDir').mockResolvedValue(undefined);
    jest.spyOn(User.prototype, 'save').mockResolvedValue(undefined);
    jest.spyOn(User.prototype, 'remove').mockResolvedValue(undefined);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('getPost - findOne should call with the appropriate options', async () => {
    const where: any = { id: userId };
    let findOneOptionsMock: any = {};

    jest.spyOn(User, 'findOne').mockImplementation((options: any) => {
      findOneOptionsMock = options;
      return {} as any;
    });

    await service.getUser(where);

    expect(findOneOptionsMock.relations).not.toBeDefined();
    expect(findOneOptionsMock.where).toEqual(where);
  });

  it('getUserIndex - should throw bad request error if id is empty', async () => {
    await expect(async () => service.getUserIndex('', { page: 1 })).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('getUserIndex - should return correct data', async () => {
    const result = await service.getUserIndex(userId, { page: 1 });

    expect(result).toEqual({
      posts: [...postsArr],
      totalPages: Math.ceil(postArrAmount / config.itemsCountPerPage),
      totalPostsCount: postArrAmount,
    });
  });

  it('findOne - should throw bad request error if id is empty', async () => {
    await expect(async () => service.findOne('')).rejects.toThrowError(BadRequestException);
  });

  it('findOne - should return data', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockImplementation(async (where: any) => {
      userMock.id = where.id;
      return userMock;
    });
    const result = await service.findOne(userId);

    expect(result).toBeDefined();
    expect(result.id).toBe(userId);
  });

  it('findOne - should throw not found error if user is null', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockResolvedValue(null);

    await expect(async () => service.findOne(userId)).rejects.toThrowError(NotFoundException);
  });

  it('create - should throw conflict username error', () => {
    expect(async () =>
      service.create({ username: 'abc', email: 'xyz' } as any, multerFileMock),
    ).rejects.toThrowError(ConflictException);
  });

  it('create - should throw conflict email error', () => {
    expect(async () =>
      service.create({ username: 'xyz', email: 'abc' } as any, multerFileMock),
    ).rejects.toThrowError(ConflictException);
  });

  it('create - should return new user', async () => {
    const result = await service.create(newUserDtoMock, multerFileMock);

    expect(result).toBeDefined();
  });

  it('create - should remove img from tmp if success', async () => {
    await service.create(newUserDtoMock, multerFileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('create - should remove img from tmp if error', async () => {
    await expect(async () => await service.create({} as any, multerFileMock)).rejects.toThrow();
    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("create - shouldn't remove img from tmp if file is empty", async () => {
    await service.create(newUserDtoMock, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });

  it('update - should throw bad request error if id is empty', async () => {
    await expect(async () => service.update('', {} as any, multerFileMock)).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('update - should throw not found error if user is null', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockResolvedValue(null);

    await expect(async () =>
      service.update(userId, newPasswordDtoMock, multerFileMock),
    ).rejects.toThrowError(NotFoundException);
  });

  it('update - should change name', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockImplementation(async (where: any) => {
      userMock.id = where.id;
      return userMock;
    });

    const newData: any = {
      firstName: 'new',
      lastName: 'new',
    };
    const result = await service.update(userId, newData, multerFileMock);

    expect(result).toEqual({
      id: userId,
      bio: userMock.bio,
      ...newData,
    });
  });

  it('update - should change bio', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockImplementation(async (where: any) => {
      userMock.id = where.id;
      return userMock;
    });

    const newData: any = { bio: 'new' };
    const result = await service.update(userId, newData, multerFileMock);

    expect(result).toEqual({
      id: userId,
      firstName: userMock.firstName,
      lastName: userMock.lastName,
      ...newData,
    });
  });

  it('update - should throw unauthorized while password is bad', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockResolvedValue(userMock);

    await expect(
      async () =>
        await service.update(
          userId,
          { ...newPasswordDtoMock, password: 'BadPassword' },
          multerFileMock,
        ),
    ).rejects.toThrowError(UnauthorizedException);
  });

  it('update - should change password', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockResolvedValue(userMock);

    const result = await service.update(userId, newPasswordDtoMock, multerFileMock);

    await expect(result).toBeDefined();
  });

  it('update - should remove img from tmp if success', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockResolvedValue(userMock);

    await service.update(userId, newUserDtoMock, multerFileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('update - should remove img from tmp if error', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockResolvedValue(userMock);

    await expect(async () =>
      service.update('', newUserDtoMock, multerFileMock),
    ).rejects.toThrowError(BadRequestException);
    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("update - shouldn't remove img from tmp if file is empty", async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockResolvedValue(userMock);

    await service.update(userId, newUserDtoMock, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });

  it('remove - should throw bad request error if id is empty', async () => {
    await expect(async () => service.remove('')).rejects.toThrowError(BadRequestException);
  });

  it('remove - should throw not found error if user is null', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockReturnValue(null);
    await expect(async () => service.remove(userId)).rejects.toThrowError(NotFoundException);
  });

  it('remove - should return user', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockResolvedValue(userMock);

    const result = await service.remove(userId);

    expect(result).toBeDefined();
  });

  it('getStats - should throw bad request error if id is empty', async () => {
    await expect(async () => service.getStats('')).rejects.toThrowError(BadRequestException);
  });

  it('getStats - should return data', async () => {
    const result = await service.getStats(userId);

    expect(result).toEqual({
      travelCount: 2,
      postCount: 1,
    });
  });

  it('getPhoto - should throw bad request error if id is empty', async () => {
    await expect(async () => service.getPhoto('')).rejects.toThrowError(BadRequestException);
  });

  it('getPhoto - should throw not found error if user is empty', async () => {
    jest.spyOn(UserService.prototype, 'getUser').mockReturnValue(null);

    await expect(async () => service.getPhoto('abc')).rejects.toThrowError(NotFoundException);
  });
});
