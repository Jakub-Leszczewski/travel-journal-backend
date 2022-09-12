import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Travel } from '../../travel/entities/travel.entity';
import { User } from '../../user/entities/user.entity';
import { Post } from '../entities/post.entity';
import { config } from '../../config/config';
import { FileManagementPost } from '../../common/utils/file-management/file-management-post';
import { TravelService } from '../../travel/travel.service';
import { UserHelperService } from '../../user/user-helper.service';
import { v4 as uuid } from 'uuid';

const moduleMocker = new ModuleMocker(global);
const userMock = new User();
const travelMock = new Travel();
const postMock = new Post();
const currentDate = new Date();
const fileMock: any = { filename: `${postMock}.png` };
const newPostData: any = {
  title: 'abc',
  description: 'abc',
  destination: 'abc',
};

const userId = uuid();
const travelId = uuid();
const postId = uuid();

let removeFromTmpMock = jest.fn(async () => undefined);
let removePostDirMock = jest.fn(async () => undefined);
let getPostPhotoMock = jest.fn(async () => 'abc');

describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostService],
    })
      .useMocker((token) => {
        if (token === TravelService) {
          return {
            getTravel: async (where: any) => Travel.findOne({ where }),
            filter: (travel: Travel) => ({ id: travel.id }),
          };
        }

        if (token === UserHelperService) {
          return {
            filterPublicData: (user: User) => ({ id: user.id }),
          };
        }

        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    userMock.id = userId;

    travelMock.id = travelId;
    travelMock.user = userMock;

    postMock.id = postId;
    postMock.title = newPostData.title;
    postMock.description = newPostData.description;
    postMock.destination = newPostData.destination;
    postMock.createdAt = currentDate;
    postMock.travel = travelMock;

    service = module.get<PostService>(PostService);

    removeFromTmpMock = jest.fn(async () => undefined);
    removePostDirMock = jest.fn(async () => undefined);
    getPostPhotoMock = jest.fn(async () => 'abc');

    jest.spyOn(FileManagementPost, 'removePostPhoto').mockReturnValue(undefined);
    jest
      .spyOn(FileManagementPost, 'savePostPhoto')
      .mockReturnValue({ filename: `${travelId}.png` } as any);
    jest.spyOn(FileManagementPost, 'removeFromTmp').mockImplementation(removeFromTmpMock);
    jest.spyOn(FileManagementPost, 'removePostPhoto').mockImplementation(removePostDirMock);
    jest.spyOn(FileManagementPost, 'getPostPhoto').mockImplementation(getPostPhotoMock as any);
    jest.spyOn(Post.prototype, 'save').mockResolvedValue(undefined);
    jest.spyOn(Post.prototype, 'remove').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getPost - findOne should call with the appropriate options', async () => {
    const where: any = { id: postId };
    let findOneOptionsMock: any = {};

    jest.spyOn(Post, 'findOne').mockImplementation((options: any) => {
      findOneOptionsMock = options;
      return {} as any;
    });

    await service.getPost(where);

    expect(findOneOptionsMock.relations.includes('travel')).toBe(true);
    expect(findOneOptionsMock.relations.includes('travel.user')).toBe(true);
    expect(findOneOptionsMock.where).toEqual(where);
  });

  it('findOne - should throw bad request error if empty id', async () => {
    await expect(async () => service.findOne('')).rejects.toThrowError(BadRequestException);
  });

  it('findOne - should throw not found error if post is empty', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockResolvedValue(null);

    await expect(async () => service.findOne(postId)).rejects.toThrowError(NotFoundException);
  });

  it('findOne - should return record with given id', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockImplementation(async (where: any) => {
      postMock.id = where.id;
      return postMock;
    });

    const result = await service.findOne(postId);

    expect(result.id).toBe(postId);
    expect(result.travelId).toBe(travelId);
    expect(result.authorId).toBe(userId);
  });

  it('findAllByTravelId - should throw bad request error if empty id', async () => {
    await expect(async () => service.findAllByTravelId('', { page: 1 })).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('findAllByTravelId - should return the correct data', async () => {
    jest.spyOn(Post, 'findAndCount').mockImplementation(async (options: any) => {
      postMock.travel.id = options.where.id;

      return [[postMock, postMock, postMock], 20];
    });

    const result = await service.findAllByTravelId(userId, { page: 1 });

    expect(result.posts[0].authorId).toBe(userId);
    expect(result.totalPostsCount).toBe(20);
    expect(result.totalPages).toBe(Math.ceil(20 / config.itemsCountPerPage));
  });

  it('findAllByTravelId - Post.findAndCount should get correct data', async () => {
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

    jest.spyOn(Post, 'findAndCount').mockImplementation(findAndCountMock);

    await service.findAllByTravelId(travelId, { page: pageNumber });

    expect(findAndCountOptions.relations.includes('travel')).toBe(true);
    expect(findAndCountOptions.relations.includes('travel.user')).toBe(true);
    expect(findAndCountOptions.where).toBeDefined();
    expect(findAndCountOptions.order.createdAt).toBe('DESC');
    expect(findAndCountOptions.skip).toBe(config.itemsCountPerPage * (pageNumber - 1));
    expect(findAndCountOptions.take).toBe(config.itemsCountPerPage);
  });

  it('create - should throw bad request error if empty id', async () => {
    await expect(async () => service.create('', newPostData, fileMock)).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('create - should throw not found error if travel empty', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(null);

    await expect(async () => service.create(travelId, newPostData, fileMock)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('create - should throw not found error if travel empty', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async () => {
      travelMock.user = undefined;
      return travelMock;
    });

    await expect(async () => service.create(travelId, newPostData, fileMock)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('create - should return data with given travel id', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async (options: any) => {
      travelMock.id = options.where.id;
      return travelMock;
    });

    const { createdAt, ...result } = await service.create(travelId, newPostData, fileMock);

    expect(result).toEqual({
      ...newPostData,
      id: undefined,
      photo: '/post/photo/undefined',
      authorId: userId,
      travelId: travelId,
    });
  });

  it('create - should remove img from tmp if success', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(travelMock);

    await service.create(travelId, newPostData, fileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('create - should remove img from tmp if error', async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(travelMock);

    await expect(async () => service.create('', newPostData, fileMock)).rejects.toThrowError(
      BadRequestException,
    );
    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("create - shouldn't remove img from tmp if file is empty", async () => {
    jest.spyOn(Travel, 'findOne').mockResolvedValue(travelMock);

    await service.create(travelId, newPostData, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });

  it('update - should throw bad request error if empty id', async () => {
    await expect(async () => service.update('', {} as any, fileMock)).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('update - should throw not found error if post empty', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockResolvedValue(null);

    await expect(async () => service.update(postId, {} as any, fileMock)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('update - should throw not found error if travel empty', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockImplementation(async () => {
      postMock.travel = undefined;
      return postMock;
    });

    await expect(async () => service.update(postId, {} as any, fileMock)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('update - should throw not found error if user empty', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockImplementation(async () => {
      postMock.travel.user = undefined;
      return postMock;
    });

    await expect(async () => service.update(postId, {} as any, fileMock)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('update - should return data with given id', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockImplementation(async (where: any) => {
      postMock.id = where.id;
      return postMock;
    });

    const newData: any = {
      description: 'new',
      destination: 'new',
      title: 'new',
    };
    const result = await service.update(postId, newData, fileMock);

    expect(result).toEqual({
      ...newData,
      id: postId,
      createdAt: currentDate,
      photo: `/post/photo/${postId}`,
      authorId: userId,
      travelId: travelId,
    });
  });

  it('update - should remove img from tmp if success', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockResolvedValue(postMock);

    await service.update(postId, {} as any, fileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('update - should remove img from tmp if error', async () => {
    jest.spyOn(Post, 'findOne').mockResolvedValue(postMock);

    await expect(async () => service.update('', {} as any, fileMock)).rejects.toThrowError(
      BadRequestException,
    );
    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("update - shouldn't remove img from tmp if file is empty", async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockResolvedValue(postMock);

    await service.create(postId, {} as any, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });

  it('remove - should throw bad request error if id is empty', async () => {
    await expect(async () => service.remove('')).rejects.toThrowError(BadRequestException);
  });

  it('remove - should throw not found error if travel is empty', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockResolvedValue(null);

    await expect(async () => service.remove(postId)).rejects.toThrowError(NotFoundException);
  });

  it('remove - should throw not found error if user is empty', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockImplementation(async () => {
      postMock.travel.user = undefined;
      return postMock;
    });

    await expect(async () => service.remove(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('remove - should return data with given id', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockImplementation(async (where: any) => {
      postMock.id = where.id;
      return postMock;
    });

    const result = await service.remove(travelId);

    expect(result).toBeDefined();
    expect(result.id).toBe(travelId);
  });

  it('remove - should remove travel dir', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockImplementation(async (where: any) => {
      postMock.id = where.id;
      return postMock;
    });

    await service.remove(travelId);

    expect(removePostDirMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('getPhoto - should throw bad request error if id is empty', async () => {
    await expect(async () => service.getPhoto('')).rejects.toThrowError(BadRequestException);
  });

  it('getPhoto - should throw not found error if post is empty', async () => {
    jest.spyOn(PostService.prototype, 'getPost').mockResolvedValue(null);

    await expect(async () => service.getPhoto(travelId)).rejects.toThrowError(NotFoundException);
  });

  it('getCountByUserId - should throw bad request error if id is empty', async () => {
    await expect(async () => service.getCountByUserId('')).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('getCountByUserId - should return count', async () => {
    jest.spyOn(Post, 'count').mockResolvedValue(3);

    const result = await service.getCountByUserId(userId);

    expect(result).toBe(3);
  });

  it('filter - should return save data', () => {
    const { photoFn, travel, ...postResponse } = postMock;
    const { user, posts } = travel;

    expect(service.filter(postMock)).toEqual({
      ...postResponse,
      photo: `/post/photo/${postResponse.id}`,
      authorId: user.id,
      travelId: travel.id,
    });
  });

  it('filterForeignPost - should return save data', () => {
    const { travel } = postMock;
    const { authorId, travelId, ...postData } = service.filter(postMock);
    const { user, posts, ...travelData } = travel;

    expect(service.filterForeignPost(postMock)).toEqual({
      ...postData,
      travel: { ...travelData },
      user: { ...user },
      photo: `/post/photo/${postData.id}`,
    });
  });
});
