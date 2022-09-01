import { Test, TestingModule } from '@nestjs/testing';
import { TravelService } from './travel.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Travel } from './entities/travel.entity';
import { User } from '../user/entities/user.entity';
import { config } from '../config/config';

const moduleMocker = new ModuleMocker(global);

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne should throw bad request error', async () => {
    await expect(async () => service.findOne('')).rejects.toThrowError(BadRequestException);
  });

  it('findOne should throw not found error', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(null);

    await expect(async () => service.findOne('abc')).rejects.toThrowError(NotFoundException);
  });

  it('findOne should return record with given id', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = 'xyz';

      const travel = new Travel();
      travel.id = 'abc';
      travel.user = user;

      return travel;
    });

    const result = await service.findOne('abc');
    expect(result.id).toBe('abc');
  });

  it('findAllByUserId should throw bad request error', async () => {
    await expect(async () => service.findAllByUserId('')).rejects.toThrowError(BadRequestException);
  });

  it('findAllByUserId should return the correct data', async () => {
    jest.spyOn(Travel, 'findAndCount').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = options.where.user.id;

      const travel = new Travel();
      travel.id = 'abc';
      travel.user = user;

      return [[travel, travel, travel], 20];
    });

    const result = await service.findAllByUserId('xyz');
    expect(result.travels[0].authorId).toBe('xyz');
    expect(result.totalTravelsCount).toBe(20);
    expect(result.totalPages).toBe(Math.ceil(20 / config.itemsCountPerPage));
  });
});
