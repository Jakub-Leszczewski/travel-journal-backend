import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../post.service';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Travel } from '../../travel/entities/travel.entity';
import { User } from '../../user/entities/user.entity';
import { Post } from '../entities/post.entity';
import { config } from '../../config/config';

const moduleMocker = new ModuleMocker(global);

const userMock = new User();
const travelMock = new Travel();
const postMock = new Post();
const fileMock: any = { filename: `${postMock}.png` };
const newPostData: any = {
  title: 'abc',
  description: 'abc',
  destination: 'abc',
};

const userId = 'abc';
const travelId = 'xyz';
const postId = 'xyz';

describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostService],
    })
      .useMocker((token) => {
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
    postMock.travel = travelMock;

    service = module.get<PostService>(PostService);
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
});
