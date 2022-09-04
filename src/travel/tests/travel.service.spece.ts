import { Test, TestingModule } from '@nestjs/testing';
import { TravelService } from '../travel.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Travel } from '../entities/travel.entity';
import { User } from '../../user/entities/user.entity';
import { config } from '../../config/config';
import { FileManagementTravel } from '../../common/utils/file-management/file-management-travel';

const moduleMocker = new ModuleMocker(global);
const userId = 'abc';
const travelId = 'xyz';
const currDate = new Date();
const userMock = new User();
const travelMock = new Travel();
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
let removeTravelDirMock = jest.fn(async () => undefined);
let getTravelPhotoMock = jest.fn(async () => 'abc');

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

    userMock.id = userId;

    travelMock.id = travelId;
    travelMock.title = newTravelData.title;
    travelMock.destination = newTravelData.destination;
    travelMock.description = newTravelData.description;
    travelMock.comradesCount = newTravelData.comradesCount;
    travelMock.startAt = new Date(newTravelData.startAt);
    travelMock.endAt = new Date(newTravelData.endAt);
    travelMock.user = userMock;

    removeFromTmpMock = jest.fn(async () => undefined);
    removeTravelDirMock = jest.fn(async () => undefined);
    getTravelPhotoMock = jest.fn(async () => 'abc');

    jest.spyOn(FileManagementTravel, 'removeTravelPhoto').mockReturnValue(undefined);
    jest
      .spyOn(FileManagementTravel, 'saveTravelPhoto')
      .mockReturnValue({ filename: `${travelId}.png` } as any);
    jest.spyOn(FileManagementTravel, 'removeFromTmp').mockImplementation(removeFromTmpMock);
    jest.spyOn(FileManagementTravel, 'removeTravelDir').mockImplementation(removeTravelDirMock);
    jest
      .spyOn(FileManagementTravel, 'getTravelPhoto')
      .mockImplementation(getTravelPhotoMock as any);
    jest.spyOn(Travel.prototype, 'save').mockResolvedValue(undefined);
    jest.spyOn(Travel.prototype, 'remove').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne - should throw bad request error if id is empty', async () => {
    await expect(async () => service.findOne('')).rejects.toThrowError(BadRequestException);
  });

  it('findOne - should throw not found error if travel is null', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(null);

    await expect(async () => service.findOne(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('findOne - should return record with given id', async () => {
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

  it('findAllByUserId - should throw bad request error if id is empty', async () => {
    await expect(async () => service.findAllByUserId('')).rejects.toThrowError(BadRequestException);
  });

  it('findAllByUserId - should return the correct data', async () => {
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

  it('create - should throw bad request error if id is empty', async () => {
    await expect(async () =>
      service.create(newTravelData, '', multerFileMock),
    ).rejects.toThrowError(BadRequestException);
  });

  it('create - should throw not found error if user is empty', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    await expect(async () =>
      service.create(newTravelData, userId, multerFileMock),
    ).rejects.toThrowError(NotFoundException);
  });

  it('create - should return record with given owner', async () => {
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

  it('create - should return bad request error if endAt is less than startAt', async () => {
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

  it('create - should remove img from tmp if success', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.id;
      return user;
    });

    await service.create(newTravelData, userId, multerFileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('create - should remove img from tmp if error', async () => {
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

  it("create - shouldn't remove img from tmp if file is empty", async () => {
    jest.spyOn(User, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.id;
      return user;
    });

    await service.create(newTravelData, userId, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });

  it('update - should throw bad request error if id is empty', async () => {
    await expect(async () =>
      service.update('', newTravelData, multerFileMock),
    ).rejects.toThrowError(BadRequestException);
  });

  it('update - should throw not found error if not found travel', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(null);

    await expect(async () =>
      service.update(travelId, newTravelData, multerFileMock),
    ).rejects.toThrowError(NotFoundException);
  });

  it('update - should throw not found error if not found travel.user', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue({} as any);

    await expect(async () =>
      service.update(travelId, newTravelData, multerFileMock),
    ).rejects.toThrowError(NotFoundException);
  });

  it('update - should return record with updated data(title, destination, description)', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(travelMock);

    const result = await service.update(
      travelId,
      {
        title: 'new',
        destination: 'new',
        description: 'new',
        id: 'new',
      } as any,
      multerFileMock,
    );

    expect(result).toEqual({
      ...newTravelData,
      id: travelId,
      title: 'new',
      destination: 'new',
      description: 'new',
      endAt: currDate,
      startAt: currDate,
      photo: `/travel/photo/${travelId}`,
      authorId: userId,
    });
  });

  it('update - should return record with updated data(comradesCount, startAt, endAt)', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(travelMock);

    const currentDatePlus = new Date(currDate.getTime() + 10);
    const result = await service.update(
      travelId,
      {
        comradesCount: 1,
        startAt: currentDatePlus.toISOString(),
        endAt: currentDatePlus.toISOString(),
      } as any,
      multerFileMock,
    );

    expect(result).toEqual({
      ...newTravelData,
      id: travelId,
      comradesCount: 1,
      startAt: currentDatePlus,
      endAt: currentDatePlus,
      photo: `/travel/photo/${travelId}`,
      authorId: userId,
    });
  });

  it('update - should return bad request error if endAt is less than startAt', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(travelMock);

    await expect(async () =>
      service.update(
        travelId,
        {
          startAt: new Date(currDate.getTime() + 10),
          endAt: currDate,
        } as any,
        multerFileMock,
      ),
    ).rejects.toThrowError(BadRequestException);
  });

  it('update - should remove img from tmp if success', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(travelMock);

    await service.update(travelId, newTravelData, multerFileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('update - should remove img from tmp if error', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(travelMock);

    await expect(async () =>
      service.update('', newTravelData, multerFileMock),
    ).rejects.toThrowError(BadRequestException);
    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("update - shouldn't remove img from tmp if file is empty", async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(travelMock);

    await service.update(travelId, newTravelData, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });

  it('remove - should throw bad request error if id is empty', async () => {
    await expect(async () => service.remove('')).rejects.toThrowError(BadRequestException);
  });

  it('remove - should throw not found error if travel is empty', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(null);

    await expect(async () => service.remove(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('remove - should throw not found error if user is empty', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async () => {
      travelMock.user = undefined;
      return travelMock;
    });

    await expect(async () => service.remove(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('remove - should return data with given id', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async (options: any) => {
      travelMock.id = options.where.id;
      return travelMock;
    });

    const result = await service.remove(travelId);

    expect(result).toBeDefined();
    expect(result.id).toBe(travelId);
  });

  it('remove - should remove travel dir', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async (options: any) => {
      travelMock.id = options.where.id;
      return travelMock;
    });

    await service.remove(travelId);

    expect(removeTravelDirMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('getPhoto - should throw bad request error if id is empty', async () => {
    await expect(async () => service.getPhoto('')).rejects.toThrowError(BadRequestException);
  });

  it('getPhoto - should throw not found error if travel is empty', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(null);

    await expect(async () => service.getPhoto(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('getPhoto - should throw not found error if user is empty', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async () => {
      travelMock.user = undefined;
      return travelMock;
    });

    await expect(async () => service.getPhoto(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('getCountByUserId - should throw bad request error if id is empty', async () => {
    await expect(async () => service.getCountByUserId('')).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('getCountByUserId - should return count', async () => {
    jest.spyOn(Travel, 'count').mockResolvedValue(3);

    const result = await service.getCountByUserId(userId);

    expect(result).toBe(3);
  });

  it('filter - should return save data', () => {
    const { photoFn, user, posts, ...travelResponse } = travelMock;

    expect(service.filter(travelMock)).toEqual({
      ...travelResponse,
      photo: `/travel/photo/${travelResponse.id}`,
      authorId: user.id,
    });
  });
});
