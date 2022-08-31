import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { User } from '../entities/user.entity';
import { Travel } from '../../travel/entities/travel.entity';
import { Post } from '../../post/entities/post.entity';
import {
  Column,
  DataSource,
  JoinTable,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TravelService } from '../../travel/travel.service';
import { ForeignPostSaveData } from '../../types';

const moduleMocker = new ModuleMocker(global);

const userDataMock = new User();
userDataMock.id = 'abc';
userDataMock.firstName = 'abc';
userDataMock.lastName = 'abc';
userDataMock.username = 'abc';
userDataMock.email = 'abc@xyz.com';
userDataMock.bio = 'abc';
userDataMock.photoFn = `/user/photo/abc`;
userDataMock.hashPwd = 'abc';
userDataMock.jwtId = 'abc';
userDataMock.travels = [];

const travelDataMock = new Travel();
travelDataMock.id = '';
travelDataMock.title = '';
travelDataMock.description = '';
travelDataMock.destination = '';
travelDataMock.comradesCount = 0;
travelDataMock.photoFn = '';
travelDataMock.startAt = new Date();
travelDataMock.endAt = new Date();
travelDataMock.user = userDataMock;
travelDataMock.posts = [];

const postDataMock = new Post();
postDataMock.id = '';
postDataMock.title = '';
postDataMock.description = '';
postDataMock.destination = '';
postDataMock.createdAt = undefined;
postDataMock.photoFn = '';
postDataMock.travel = travelDataMock;

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    })
      .useMocker((token) => {
        if (token === DataSource) {
          const postsArr = [postDataMock, postDataMock, postDataMock];

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
            getManyAndCount: async () => [postsArr, 3],
          };

          return {
            createQueryBuilder: () => createQueryBuilder,
          };
        } else if (token === TravelService) {
          return {
            filter(): ForeignPostSaveData {
              return {
                id: '',
                createdAt: undefined,
                description: '',
                destination: '',
                photo: '',
                title: '',
                travelId: '',
                travel: undefined,
                authorId: '',
                user: undefined,
              };
            },
          };
        } else if (token === TravelService) {
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

  it('should return index page data', () => {
    const postsArr = [postDataMock, postDataMock, postDataMock];

    expect(service.getIndex('abc', 1));
  });
});
