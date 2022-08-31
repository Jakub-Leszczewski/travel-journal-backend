import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { DataSource } from 'typeorm';
import { PostService } from '../../post/post.service';
import { config } from '../../config/config';

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
            groupBy: () => createQueryBuilder,
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
    const data = await service.getIndex('abc', 1);

    expect(data.posts.length).toBe(4);
    expect(data.posts[0].user.id).toBe(ownerId);
    expect(data.totalPages).toBe(Math.ceil(data.posts.length / config.itemsCountPerPage));
    expect(data.totalPostsCount).toBe(4);
  });
});
