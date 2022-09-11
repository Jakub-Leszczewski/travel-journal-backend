import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { UserHelperService } from '../user-helper.service';
import { User } from '../entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

const moduleMocker = new ModuleMocker(global);
const userDataMock = new User();
userDataMock.id = uuid();
userDataMock.firstName = 'abc';
userDataMock.lastName = 'abc';
userDataMock.username = 'abc';
userDataMock.email = 'abc@xyz.com';
userDataMock.bio = 'abc';
userDataMock.photoFn = `/user/photo/abc`;
userDataMock.hashPwd = 'abc';
userDataMock.jwtId = 'abc';

describe('UserHelperService', () => {
  let service: UserHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserHelperService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();
    service = module.get<UserHelperService>(UserHelperService);
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });

  it('filter should return save data', () => {
    const { jwtId, hashPwd, photoFn, travels, friends, friendsRevert, ...userResponse } =
      userDataMock;
    const userFilteredData = { ...userResponse, avatar: `/user/photo/${userResponse.id}` };

    expect(service.filter(userDataMock)).toEqual(userFilteredData);
  });

  it('filterPublicData should return only public data', () => {
    const {
      jwtId,
      hashPwd,
      photoFn,
      email,
      bio,
      travels,
      friends,
      friendsRevert,
      ...userResponse
    } = userDataMock;
    const userFilteredData = { ...userResponse, avatar: `/user/photo/${userResponse.id}` };

    expect(service.filterPublicData(userDataMock)).toEqual(userFilteredData);
  });

  it('checkUserFieldUniqueness should return false', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(userDataMock);

    const result = await service.checkUserFieldUniqueness({ email: 'abc@xyz.pl' });
    expect(result).toBe(false);
  });

  it('checkUserFieldUniqueness should return true', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    const result = await service.checkUserFieldUniqueness({ email: 'abc@xyz.pl' });
    expect(result).toBe(true);
  });

  it('checkUserFieldUniquenessAndThrow should throw error', () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(userDataMock);

    expect(
      async () => await service.checkUserFieldUniquenessAndThrow({ email: 'abc@xyz.pl' }),
    ).rejects.toThrowError(ConflictException);
  });

  it("checkUserFieldUniquenessAndThrow shouldn't throw error", async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    await expect(
      service.checkUserFieldUniquenessAndThrow({ email: 'abc@xyz.pl' }),
    ).resolves.toBeUndefined();
  });
});
