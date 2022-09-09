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

const userId = 'abc';
const travelId = 'xyz';
const postId = 'xyz';

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

  it('findOne - should throw bad request error if empty id', async () => {
    await expect(async () => service.findOne('')).rejects.toThrowError(BadRequestException);
  });

  it('findOne - should throw not found error if post is empty', async () => {
    jest.spyOn(Post, 'findOne').mockResolvedValue(null);

    await expect(async () => service.findOne(postId)).rejects.toThrowError(NotFoundException);
  });

  it('findOne - should return record with given id', async () => {
    jest.spyOn(Post, 'findOne').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = userId;

      const travel = new Travel();
      travel.id = travelId;
      travel.user = user;

      const post = new Post();
      post.id = options.where.id;
      post.travel = travel;

      return post;
    });

    const result = await service.findOne(postId);

    expect(result.id).toBe(postId);
    expect(result.travelId).toBe(travelId);
    expect(result.authorId).toBe(userId);
  });

  it('findAllByTravelId - should throw bad request error if empty id', async () => {
    await expect(async () => service.findAllByTravelId('')).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('findAllByTravelId - should return the correct data', async () => {
    jest.spyOn(Post, 'findAndCount').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = userId;

      const travel = new Travel();
      travel.id = travelId;
      travel.user = user;

      const post = new Post();
      post.id = options.where.id;
      post.travel = travel;

      return [[post, post, post], 20];
    });

    const result = await service.findAllByTravelId(userId);

    expect(result.posts[0].authorId).toBe(userId);
    expect(result.totalPostsCount).toBe(20);
    expect(result.totalPages).toBe(Math.ceil(20 / config.itemsCountPerPage));
  });

  it('getPost - should take correct data', async () => {
    jest.spyOn(Post, 'findAndCount').mockImplementation(async (options: any) => {
      const user = new User();
      user.id = userId;

      const travel = new Travel();
      travel.id = travelId;
      travel.user = user;

      const post = new Post();
      post.id = options.where.id;
      post.travel = travel;

      return [[post, post, post], 20];
    });
  });

  it('getPost - findOne should call findOne with the appropriate options', async () => {
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
      travelMock.user = null;
      return travelMock;
    });

    await expect(async () => service.create(travelId, newPostData, fileMock)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('create - should return correct data', async () => {
    jest.spyOn(Travel, 'findOne').mockImplementation(async (options: any) => {
      const travel = new Travel();
      travel.id = options.where.id;
      travel.user = userMock;
      return travel;
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
    await expect(async () => service.update('', newPostData, fileMock)).rejects.toThrowError(
      BadRequestException,
    );
  });

  it('update - should throw not found error if post empty', async () => {
    jest.spyOn(Post, 'findOne').mockResolvedValue(null);

    await expect(async () => service.update(postId, newPostData, fileMock)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('update - should throw not found error if travel empty', async () => {
    jest.spyOn(Post, 'findOne').mockImplementation(async () => {
      postMock.travel = null;
      return postMock;
    });

    await expect(async () => service.update(postId, newPostData, fileMock)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('update - should throw not found error if user empty', async () => {
    jest.spyOn(Post, 'findOne').mockImplementation(async () => {
      postMock.travel.user = null;
      return postMock;
    });

    await expect(async () => service.update(postId, newPostData, fileMock)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('update - should return correct data', async () => {
    jest.spyOn(Post, 'findOne').mockImplementation(async (options: any) => {
      postMock.id = options.where.id;
      return postMock;
    });

    const result = await service.update(
      postId,
      {
        description: 'new',
        destination: 'new',
        title: 'new',
      } as any,
      fileMock,
    );

    expect(result).toEqual({
      id: postId,
      title: 'new',
      description: 'new',
      destination: 'new',
      createdAt: currentDate,
      photo: `/post/photo/${postId}`,
      authorId: userId,
      travelId: travelId,
    });
  });

  it('update - should remove img from tmp if success', async () => {
    jest.spyOn(Post, 'findOne').mockResolvedValue(postMock);

    await service.update(postId, newPostData, fileMock);

    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('update - should remove img from tmp if error', async () => {
    jest.spyOn(Post, 'findOne').mockResolvedValue(postMock);

    await expect(async () => service.update('', newPostData, fileMock)).rejects.toThrowError(
      BadRequestException,
    );
    expect(removeFromTmpMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("update - shouldn't remove img from tmp if file is empty", async () => {
    jest.spyOn(Post, 'findOne').mockResolvedValue(postMock);

    await service.create(postId, newPostData, undefined);

    expect(removeFromTmpMock.mock.calls.length).toBe(0);
  });
});
