import { Test, TestingModule } from '@nestjs/testing';
import { TravelService } from '../travel.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Travel } from '../entities/travel.entity';
import { User } from '../../user/entities/user.entity';
import { config } from '../../config/config';
import { FileManagementUser } from '../../common/utils/file-management/file-management-user';
import { FileManagementTravel } from '../../common/utils/file-management/file-management-travel';

const moduleMocker = new ModuleMocker(global);
const userId = 'abc';
const travelId = 'xyz';
const currDate = new Date();
const multerFileMock: any = { filename: `${travelId}.png` };
const newTravelData: any = {
  comradesCount: 0,
  description: 'abc',
  destination: 'abc',
  endAt: currDate.toISOString(),
  startAt: currDate.toISOString(),
  title: 'abc',
};
let removeFromTmpMock = jest.fn(async () => undefined);

describe('TravelService', () => {
  let service: TravelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TravelService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<TravelService>(TravelService);

    removeFromTmpMock = jest.fn(async () => undefined);
    jest.spyOn(FileManagementTravel, 'removeTravelPhoto').mockReturnValue(undefined);
    jest
      .spyOn(FileManagementTravel, 'saveTravelPhoto')
      .mockReturnValue({ filename: `${travelId}.png` } as any);
    jest.spyOn(FileManagementTravel, 'removeFromTmp').mockImplementation(removeFromTmpMock);
    jest.spyOn(FileManagementTravel, 'removeTravelDir').mockReturnValue(undefined);
    jest.spyOn(Travel.prototype, 'save').mockResolvedValue(undefined);
    jest.spyOn(Travel.prototype, 'remove').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne should throw bad request error', async () => {
    await expect(async () => service.findOne('')).rejects.toThrowError(BadRequestException);
  });

  it('findOne should throw not found error', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(null);

    await expect(async () => service.findOne(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('findOne should return record with given id', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = userId;

      const travel = new Travel();
      travel.id = options.where.id;
      travel.user = user;

      return travel;
    });

    const result = await service.findOne(travelId);
    expect(result.id).toBe(travelId);
  });

  it('findAllByUserId should throw bad request error', async () => {
    await expect(async () => service.findAllByUserId('')).rejects.toThrowError(BadRequestException);
  });

  it('findAllByUserId should return the correct data', async () => {
    jest.spyOn(Travel, 'findAndCount').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.user.id;

      const travel = new Travel();
      travel.id = travelId;
      travel.user = user;

      return [[travel, travel, travel], 20];
    });

    const result = await service.findAllByUserId(userId);
    expect(result.travels[0].authorId).toBe(userId);
    expect(result.totalTravelsCount).toBe(20);
    expect(result.totalPages).toBe(Math.ceil(20 / config.itemsCountPerPage));
  });

  it('create should throw bad request error', async () => {
    await expect(async () =>
      service.create(newTravelData, '', multerFileMock),
    ).rejects.toThrowError(BadRequestException);
  });

  it('create should throw not found error', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    await expect(async () =>
      service.create(newTravelData, userId, multerFileMock),
    ).rejects.toThrowError(NotFoundException);
  });

  it('create should return record with given owner', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.id;
      return user;
    });

    const result = await service.create(newTravelData, userId, multerFileMock);

    expect(result).toEqual({
      ...newTravelData,
      endAt: currDate,
      startAt: currDate,
      photo: `/travel/photo/${undefined}`,
      authorId: userId,
    });
  });

  it('create should return bad request error if endAt is less than startAt', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.id;
      return user;
    });

    await expect(async () =>
      service.create(
        {
          ...newTravelData,
          startAt: new Date(currDate.getTime() + 10),
          endAt: currDate,
        },
        userId,
        multerFileMock,
      ),
    ).rejects.toThrowError(BadRequestException);
  });

  it('create should remove img from tmp if success', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.id;
      return user;
    });

    const result = await service.create(newTravelData, userId, multerFileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('create should remove img from tmp if error', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.id;
      return user;
    });

    await expect(async () =>
      service.create(newTravelData, '', multerFileMock),
    ).rejects.toThrowError(BadRequestException);
    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("create shouldn't remove img from tmp if file is empty", async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.id;
      return user;
    });

    const result = await service.create(newTravelData, userId, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });
});
