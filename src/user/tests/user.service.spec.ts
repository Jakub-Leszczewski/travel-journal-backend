import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { DataSource } from 'typeorm';
import { PostService } from '../../post/post.service';
import { config } from '../../config/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserHelperService } from '../user-helper.service';

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
          };
        } else if (token === UserHelperService) {
          return {
            filter(user: User) {
              return { id: user.id };
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

  it('if id is empty should throw bad request exception', async () => {
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
});
