import { Test, TestingModule } from '@nestjs/testing';
import { TravelController } from '../travel.controller';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { TravelService } from '../travel.service';
import { v4 as uuid } from 'uuid';
import { PostService } from '../../post/post.service';

const moduleMocker = new ModuleMocker(global);

const findOneResult = 'findOne';
const updateResult = 'update';
const removeResult = 'remove';
const getPhotoResult = 'getPhoto';
const createPostResult = 'createPost';
const findAllPostsResult = 'findAllPosts';

const travelId = uuid();
const fileMock: any = { multer: true };
const bodyMock: any = { body: true };
const queryMock: any = { query: true };

describe('TravelController', () => {
  let controller: TravelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TravelController],
    })
      .useMocker((token) => {
        if (token === TravelService) {
          return {
            findOne: jest.fn(async (id) => ({ id, result: findOneResult })),
            update: jest.fn(async (id, body, file) => ({ id, body, file, result: updateResult })),
            remove: jest.fn(async (id) => ({ id, result: removeResult })),
            getPhoto: jest.fn(async (id) => ({ id, result: getPhotoResult })),
          };
        }

        if (token === PostService) {
          return {
            create: jest.fn(async (id, body, file) => ({
              id,
              body,
              file,
              result: createPostResult,
            })),
            findAllByTravelId: jest.fn(async (id, query) => ({
              id,
              query,
              result: findAllPostsResult,
            })),
          };
        }

        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = module.get<TravelController>(TravelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findOne - should calls to travelService.findOne', async () => {
    const result: any = await controller.findOne(travelId);

    expect(result.result).toBe(findOneResult);
    expect(result.id).toEqual(travelId);
  });

  it('update - should calls to travelService.update', async () => {
    const result: any = await controller.update(travelId, bodyMock, fileMock);

    expect(result.result).toBe(updateResult);
    expect(result.id).toEqual(travelId);
    expect(result.body).toEqual(bodyMock);
    expect(result.file).toEqual(fileMock);
  });

  it('remove - should calls to travelService.remove', async () => {
    const result: any = await controller.remove(travelId);

    expect(result.result).toBe(removeResult);
    expect(result.id).toEqual(travelId);
  });

  it('getPhoto - should calls to travelService.getPhoto', async () => {
    const result: any = await controller.getPhoto(travelId);

    expect(result.result).toBe(getPhotoResult);
    expect(result.id).toEqual(travelId);
  });

  it('createPost - should calls to postService.create', async () => {
    const result: any = await controller.createPost(travelId, bodyMock, fileMock);

    expect(result.result).toBe(createPostResult);
    expect(result.id).toEqual(travelId);
    expect(result.body).toEqual(bodyMock);
    expect(result.file).toEqual(fileMock);
  });

  it('findAllPosts - should calls to postService.findAllByTravelId', async () => {
    const result: any = await controller.findAllPosts(travelId, queryMock);

    expect(result.result).toBe(findAllPostsResult);
    expect(result.id).toEqual(travelId);
    expect(result.query).toEqual(queryMock);
  });
});
