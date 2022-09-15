import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from '../post.controller';
import { PostService } from '../post.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { v4 as uuid } from 'uuid';

const moduleMocker = new ModuleMocker(global);

const findOneResult = 'findOne';
const updateResult = 'update';
const removeResult = 'remove';
const getPhotoResult = 'getPhoto';

const postId = uuid();
const fileMock: any = { multer: true };
const bodyMock: any = { body: true };

describe('PostController', () => {
  let controller: PostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
    })
      .useMocker((token) => {
        if (token === PostService) {
          return {
            findOne: jest.fn(async (id) => ({ id, result: findOneResult })),
            update: jest.fn(async (id, body, file) => ({ id, body, file, result: updateResult })),
            remove: jest.fn(async (id) => ({ id, result: removeResult })),
            getPhoto: jest.fn(async (id) => ({ id, result: getPhotoResult })),
          };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findOne - should calls to postService.findOne', async () => {
    const result: any = await controller.findOne(postId);

    expect(result.result).toBe(findOneResult);
    expect(result.id).toEqual(postId);
  });

  it('update - should calls to postService.update', async () => {
    const result: any = await controller.update(postId, bodyMock, fileMock);

    expect(result.result).toBe(updateResult);
    expect(result.id).toEqual(postId);
    expect(result.body).toEqual(bodyMock);
    expect(result.file).toEqual(fileMock);
  });

  it('remove - should calls to postService.remove', async () => {
    const result: any = await controller.remove(postId);

    expect(result.result).toBe(removeResult);
    expect(result.id).toEqual(postId);
  });

  it('getPhoto - should calls to postService.getPhoto', async () => {
    const result: any = await controller.getPhoto(postId);

    expect(result.result).toBe(getPhotoResult);
    expect(result.id).toEqual(postId);
  });
});
