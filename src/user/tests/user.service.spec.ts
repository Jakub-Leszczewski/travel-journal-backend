import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Travel } from '../../travel/entities/travel.entity';
import { TravelInterface } from '../../types';
import { Post } from '../../post/entities/post.entity';

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

const travelDataMock = new Travel();
travelDataMock.comradesCount = 0;
travelDataMock.description = '';
travelDataMock.destination = '';
travelDataMock.endAt = undefined;
travelDataMock.id = '';
travelDataMock.photoFn = '';
travelDataMock.startAt = undefined;
travelDataMock.title = '';

const postDataMock = new Post();
const pos: Post = {
  createdAt: undefined,
  description: '',
  destination: '',
  id: '',
  photoFn: '',
  title: '',
  travel: undefined,
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
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

  // if('should return index page data', () => {
  //   jest.spyOn(DataSource.prototype, 'createQueryBuilder').mockResolvedValue([[], 3])
  // })
});
