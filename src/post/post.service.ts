import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import {
  CreatePostResponse,
  DeletePostResponse,
  ForeignPostSaveData,
  GetPostResponse,
  GetPostsResponse,
  PostInterface,
  PostSaveResponseData,
} from '../types';
import { Travel } from '../travel/entities/travel.entity';
import { Post } from './entities/post.entity';
import { FileManagementPost } from '../common/utils/file-management/file-management-post';
import { config } from '../config/config';
import { createReadStream, ReadStream } from 'fs';
import { FileManagement } from '../common/utils/file-management/file-management';
import { TravelService } from '../travel/travel.service';
import { UserHelperService } from '../user/user-helper.service';
import { FindTravelsQueryDto } from './dto/find-posts-query.dto';

@Injectable()
export class PostService {
  constructor(
    @Inject(forwardRef(() => TravelService)) private travelService: TravelService,
    @Inject(forwardRef(() => UserHelperService)) private userHelperService: UserHelperService,
  ) {}

  async findOne(id: string): Promise<GetPostResponse> {
    if (!id) throw new BadRequestException();

    const post = await this.getPost({ id });
    if (!post) throw new NotFoundException();

    return this.filter(post);
  }

  async findAllByTravelId(id: string, { page }: FindTravelsQueryDto): Promise<GetPostsResponse> {
    if (!id) throw new BadRequestException('id is empty');

    const [posts, totalPostsCount] = await Post.findAndCount({
      where: {
        travel: { id },
      },
      relations: ['travel', 'travel.user'],
      order: { createdAt: 'DESC' },
      skip: config.itemsCountPerPage * (page - 1),
      take: config.itemsCountPerPage,
    });

    return {
      posts: posts.map((e) => this.filter(e)),
      totalPages: Math.ceil(totalPostsCount / config.itemsCountPerPage),
      totalPostsCount,
    };
  }

  async getPost(where: Partial<PostInterface>): Promise<Post> {
    return Post.findOne({
      where,
      relations: ['travel', 'travel.user'],
    });
  }

  async create(
    travelId: string,
    createPostDto: CreatePostDto,
    file: Express.Multer.File,
  ): Promise<CreatePostResponse> {
    try {
      if (!travelId) throw new BadRequestException();

      const travel = await this.travelService.getTravel({ id: travelId });
      if (!travel || !travel.user) throw new NotFoundException();

      const post = new Post();
      post.title = createPostDto.title;
      post.destination = createPostDto.destination;
      post.description = createPostDto.description;
      post.createdAt = new Date();
      await post.save();

      post.travel = travel;
      await post.save();

      if (file) {
        if (post.photoFn) {
          await FileManagementPost.removePostPhoto(travel.user.id, travel.id, post.photoFn);
        }
        const newFile = await FileManagementPost.savePostPhoto(travel.user.id, travel.id, file);
        await FileManagementPost.removeFromTmp(file.filename);

        post.photoFn = newFile.filename;
        await post.save();
      }

      return this.filter(post);
    } catch (e) {
      if (file) await FileManagementPost.removeFromTmp(file.filename);
      throw e;
    }
  }

  async update(id: string, updatePostDto: UpdatePostDto, file: Express.Multer.File) {
    try {
      if (!id) throw new BadRequestException();

      const post = await this.getPost({ id });
      if (!post || !post.travel || !post.travel.user) throw new NotFoundException();

      post.title = updatePostDto.title ?? post.title;
      post.destination = updatePostDto.destination ?? post.destination;
      post.description = updatePostDto.description ?? post.description;
      await post.save();

      if (file) {
        if (post.photoFn) {
          await FileManagementPost.removePostPhoto(
            post.travel.user.id,
            post.travel.id,
            post.photoFn,
          );
        }

        const newFile = await FileManagementPost.savePostPhoto(
          post.travel.user.id,
          post.travel.id,
          file,
        );
        await FileManagementPost.removeFromTmp(file.filename);

        post.photoFn = newFile.filename;
        await post.save();
      }

      return this.filter(post);
    } catch (e) {
      if (file) await FileManagementPost.removeFromTmp(file.filename);
      throw e;
    }
  }

  async remove(id: string): Promise<DeletePostResponse> {
    if (!id) throw new BadRequestException();

    const post = await this.getPost({ id });
    if (!post || !post.travel || !post.travel.user) throw new NotFoundException();

    if (post.photoFn)
      await FileManagementPost.removePostPhoto(post.travel.user.id, post.travel.id, post.photoFn);
    await post.remove();

    return this.filter(post);
  }

  async getPhoto(id: string): Promise<ReadStream> {
    if (!id) throw new BadRequestException();

    const post = await this.getPost({ id });
    if (!post) throw new NotFoundException();

    if (post.photoFn && post.travel && post.travel.user) {
      const filePath = FileManagementPost.getPostPhoto(
        post.travel.user.id,
        post.travel.id,
        post.photoFn,
      );
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('no-image.png'));
  }

  async getCountByUserId(id: string): Promise<number> {
    if (!id) throw new BadRequestException();

    return Post.count({
      where: { travel: { user: { id } } },
    });
  }

  filter(post: Post): PostSaveResponseData {
    const { photoFn, travel, ...postResponse } = post;
    const { user, posts } = travel;

    return {
      ...postResponse,
      photo: `/post/photo/${postResponse.id}`,
      authorId: user.id,
      travelId: travel.id,
    };
  }

  filterForeignPost(post: Post): ForeignPostSaveData {
    const { authorId, travelId, ...postData } = this.filter(post);
    const { travel } = post;
    const { user, posts } = travel;

    return {
      ...postData,
      travel: { ...this.travelService.filter(travel) },
      user: { ...this.userHelperService.filterPublicData(user) },
    };
  }
}
