import { Test, TestingModule } from '@nestjs/testing';
import { TravelService } from '../travel.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Travel } from '../entities/travel.entity';
import { User } from '../../user/entities/user.entity';
import { config } from '../../config/config';
import { FileManagementTravel } from '../../common/utils/file-management/file-management-travel';
import { v4 as uuid } from 'uuid';
import { UserService } from '../../user/user.service';
import { FindOptionsWhere } from 'typeorm';

const moduleMocker = new ModuleMocker(global);

const userId = uuid();
const notFoundId = uuid();
const travelId = uuid();
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
let travelSaveMock = jest.fn(async () => undefined);
let travelRemoveMock = jest.fn(async () => undefined);

describe('TravelService', () => {
  let service: TravelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TravelService],
    })
      .useMocker((token) => {
        if (token === UserService) {
          return {
            getUser: async (where: FindOptionsWhere<User>) => User.findOne({ where }),
          };
        }

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
    travelSaveMock = jest.fn(async () => undefined);
    travelRemoveMock = jest.fn(async () => undefined);

    jest.spyOn(FileManagementTravel, 'removeTravelPhoto').mockReturnValue(undefined);
    jest
      .spyOn(FileManagementTravel, 'saveTravelPhoto')
      .mockReturnValue({ filename: `${travelId}.png` } as any);
    jest.spyOn(FileManagementTravel, 'removeFromTmp').mockImplementation(removeFromTmpMock);
    jest.spyOn(FileManagementTravel, 'removeTravelDir').mockImplementation(removeTravelDirMock);
    jest
      .spyOn(FileManagementTravel, 'getTravelPhoto')
      .mockImplementation(getTravelPhotoMock as any);
    jest.spyOn(Travel.prototype, 'save').mockImplementation(travelSaveMock);
    jest.spyOn(Travel.prototype, 'remove').mockImplementation(travelRemoveMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getTravel - findOne should call with the appropriate options', async () => {
    const where: any = { id: travelId };
    let findOneOptionsMock: any = {};

    jest.spyOn(Travel, 'findOne').mockImplementation((options: any) => {
      findOneOptionsMock = options;
      return {} as any;
    });

    await service.getTravel(where);

    expect(findOneOptionsMock.relations.includes('user')).toBe(true);
    expect(findOneOptionsMock.where).toEqual(where);
  });

  it('findOne - should throw bad request error if id is empty', async () => {
    await expect(async () => service.findOne('')).rejects.toThrowError(BadRequestException);
  });

  it('findOne - should throw not found error if travel is empty', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(null);

    await expect(async () => service.findOne(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('findOne - should return record with given id', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockImplementation(async (where: any) => {
      travelMock.id = where.id;
      return travelMock;
    });

    const result = await service.findOne(travelId);
    expect(result.id).toBe(travelId);
  });

  it('findAllByUserId - should throw bad request error if id is empty', async () => {
    await expect(async () => service.findAllByUserId('', { page: 1 })).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('findAllByUserId - should return the correct data', async () => {
    jest.spyOn(Travel, 'findAndCount').mockImplementation(async (options: any) => {
      travelMock.user.id = options.where.user.id;
      return [[travelMock, travelMock, travelMock], 20];
    });

    const result = await service.findAllByUserId(userId, { page: 1 });
    expect(result.travels[0].authorId).toBe(userId);
    expect(result.totalTravelsCount).toBe(20);
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

    jest.spyOn(Travel, 'findAndCount').mockImplementation(findAndCountMock);

    await service.findAllByUserId(userId, { page: pageNumber });

    expect(findAndCountOptions.relations.includes('user')).toBe(true);
    expect(findAndCountOptions.where).toBeDefined();
    expect(findAndCountOptions.order.startAt).toBe('DESC');
    expect(findAndCountOptions.skip).toBe(config.itemsCountPerPage * (pageNumber - 1));
    expect(findAndCountOptions.take).toBe(config.itemsCountPerPage);
  });

  it('create - should throw bad request error if id is empty', async () => {
    await expect(async () =>
      service.create('', newTravelData, multerFileMock),
    ).rejects.toThrowError(BadRequestException);
  });

  it('create - should throw not found error if user is empty', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    await expect(async () =>
      service.create(notFoundId, newTravelData, multerFileMock),
    ).rejects.toThrowError(NotFoundException);
  });

  it('create - should return correct data', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(userMock);

    const result = await service.create(userId, newTravelData, multerFileMock);

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
        userId,
        {
          ...newTravelData,
          startAt: new Date(currDate.getTime() + 10),
          endAt: currDate,
        },
        multerFileMock,
      ),
    ).rejects.toThrowError(BadRequestException);
  });

  it('create - should remove img from tmp if success', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(userMock);

    await service.create(userId, newTravelData, multerFileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('create - should remove img from tmp if error', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(userMock);

    await expect(async () =>
      service.create('', newTravelData, multerFileMock),
    ).rejects.toThrowError(BadRequestException);
    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("create - shouldn't remove img from tmp if file is empty", async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(userMock);

    await service.create(userId, newTravelData, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });

  it('create - should update record in database', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(userMock);

    await service.create(userId, newTravelData, multerFileMock);

    expect(travelSaveMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('update - should throw bad request error if id is empty', async () => {
    await expect(async () =>
      service.update('', newTravelData, multerFileMock),
    ).rejects.toThrowError(BadRequestException);
  });

  it('update - should throw not found error if not found travel', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(null);

    await expect(async () =>
      service.update(notFoundId, {} as any, multerFileMock),
    ).rejects.toThrowError(NotFoundException);
  });

  it('update - should throw not found error if not found travel.user', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockImplementation(async () => {
      travelMock.user = undefined;
      return travelMock;
    });

    await expect(async () =>
      service.update(travelId, {} as any, multerFileMock),
    ).rejects.toThrowError(NotFoundException);
  });

  it('update - should return record with updated data(title, destination, description)', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    const newData: any = {
      title: 'new',
      destination: 'new',
      description: 'new',
    };
    const result = await service.update(travelId, newData, multerFileMock);

    expect(result).toEqual({
      ...newTravelData,
      ...newData,
      id: travelId,
      endAt: currDate,
      startAt: currDate,
      photo: `/travel/photo/${travelId}`,
      authorId: userId,
    });
  });

  it('update - should return record with updated data(comradesCount, startAt, endAt)', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    const currentDatePlus = new Date(currDate.getTime() + 10);
    const newData: any = {
      comradesCount: 1,
      startAt: currentDatePlus,
      endAt: currentDatePlus,
    };
    const result = await service.update(travelId, newData, multerFileMock);

    expect(result).toEqual({
      ...newTravelData,
      ...newData,
      id: travelId,
      photo: `/travel/photo/${travelId}`,
      authorId: userId,
    });
  });

  it('update - should return bad request error if endAt is less than startAt', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    const newData: any = {
      startAt: new Date(currDate.getTime() + 10),
      endAt: currDate,
    };

    await expect(async () =>
      service.update(travelId, newData, multerFileMock),
    ).rejects.toThrowError(BadRequestException);
  });

  it('update - should remove img from tmp if success', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    await service.update(travelId, newTravelData, multerFileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('update - should remove img from tmp if error', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    await expect(async () => service.update('', {} as any, multerFileMock)).rejects.toThrowError(
      BadRequestException,
    );
    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("update - shouldn't remove img from tmp if file is empty", async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    await service.update(travelId, {} as any, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });

  it('update - should update record in database', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    await service.update(travelId, newTravelData, multerFileMock);

    expect(travelSaveMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('remove - should throw bad request error if id is empty', async () => {
    await expect(async () => service.remove('')).rejects.toThrowError(BadRequestException);
  });

  it('remove - should throw not found error if travel is empty', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(null);

    await expect(async () => service.remove(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('remove - should throw not found error if user is empty', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockImplementation(async () => {
      travelMock.user = undefined;
      return travelMock;
    });

    await expect(async () => service.remove(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('remove - should return data with given id', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    const result = await service.remove(travelId);

    expect(result).toBeDefined();
    expect(result.id).toBe(travelId);
  });

  it('remove - should remove travel dir', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    await service.remove(travelId);

    expect(removeTravelDirMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('remove - should remove record from database', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(travelMock);

    await service.remove(travelId);

    expect(travelRemoveMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('getPhoto - should throw bad request error if id is empty', async () => {
    await expect(async () => service.getPhoto('')).rejects.toThrowError(BadRequestException);
  });

  it('getPhoto - should throw not found error if travel is empty', async () => {
    jest.spyOn(TravelService.prototype, 'getTravel').mockResolvedValue(null);

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
