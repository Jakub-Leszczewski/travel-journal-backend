import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { compare } from 'bcrypt';
import {
  CreateUserResponse,
  DeleteUserResponse,
  FriendshipStatus,
  GetUserIndexResponse,
  GetUserResponse,
  GetUserStatsResponse,
  UpdateUserResponse,
  UserInterface,
} from '../types';
import { createHashPwd } from '../common/utils/create-hash-pwd';
import { Express } from 'express';
import { FileManagementUser } from '../common/utils/file-management/file-management-user';
import { UserHelperService } from './user-helper.service';
import { TravelService } from '../travel/travel.service';
import { PostService } from '../post/post.service';
import { Brackets, DataSource, FindOptionsWhere } from 'typeorm';
import { Post } from '../post/entities/post.entity';
import { config } from '../config/config';
import { createReadStream } from 'fs';
import { FileManagement } from '../common/utils/file-management/file-management';
import { FindIndexQueryDto } from './dto/find-index-query.dto';
import { FriendshipService } from '../friendship/friendship.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => FriendshipService)) private friendService: FriendshipService,
    @Inject(forwardRef(() => UserHelperService)) private userHelperService: UserHelperService,
    @Inject(forwardRef(() => TravelService)) private travelService: TravelService,
    @Inject(forwardRef(() => PostService)) private postService: PostService,
    @Inject(DataSource) private dataSource: DataSource,
  ) {}

  async getUser(where: FindOptionsWhere<User>): Promise<User> {
    return User.findOne({ where });
  }

  async getUserIndex(id: string, { page }: FindIndexQueryDto): Promise<GetUserIndexResponse> {
    if (!id) throw new BadRequestException();

    const [posts, totalPostsCount] = await this.dataSource
      .createQueryBuilder()
      .select(['post', 'travel', 'user'])
      .from(Post, 'post')
      .leftJoin('post.travel', 'travel')
      .leftJoin('travel.user', 'user')
      .where(
        new Brackets((qb) =>
          qb.where((qb) => {
            const subQuery = qb
              .subQuery()
              .select(['friend.id'])
              .from(User, 'friend')
              .leftJoin('friend.friendsRevert', 'friendship')
              .leftJoin('friendship.user', 'user')
              .where('user.id=:id', { id })
              .andWhere('friendship.status = :status', { status: FriendshipStatus.Accepted })
              .getQuery();

            return 'user.id IN' + subQuery;
          }),
        ),
      )
      .orWhere('user.id=:id', { id })
      .orderBy('post.createdAt', 'DESC')
      .skip(config.itemsCountPerPage * (page - 1))
      .take(config.itemsCountPerPage)
      .getManyAndCount();

    const postsFiltered = posts.map((post) => this.postService.filterForeignPost(post));

    return {
      posts: postsFiltered,
      totalPages: Math.ceil(totalPostsCount / config.itemsCountPerPage),
      totalPostsCount,
    };
  }

  async findOne(id: string): Promise<GetUserResponse> {
    if (!id) throw new BadRequestException();

    const user = await this.getUser({ id });
    if (!user) throw new NotFoundException();

    return this.userHelperService.filter(user);
  }

  async create(
    createUserDto: CreateUserDto,
    file: Express.Multer.File,
  ): Promise<CreateUserResponse> {
    try {
      await this.userHelperService.checkUserFieldUniquenessAndThrow({
        email: createUserDto.email,
      });
      await this.userHelperService.checkUserFieldUniquenessAndThrow({
        username: createUserDto.username,
      });

      const user = new User();
      user.firstName = createUserDto.firstName;
      user.lastName = createUserDto.lastName;
      user.username = createUserDto.username;
      user.email = createUserDto.email;
      user.hashPwd = await createHashPwd(createUserDto.password);

      await user.save();
      if (file) {
        if (user.photoFn) {
          await FileManagementUser.removeUserPhoto(user.id, user.photoFn);
        }

        const newFile = await FileManagementUser.saveUserPhoto(user.id, file);
        await FileManagementUser.removeFromTmp(file.filename);

        user.photoFn = newFile.filename;
      }

      await user.save();

      return this.userHelperService.filter(user);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ): Promise<UpdateUserResponse> {
    try {
      if (!id) throw new BadRequestException();

      const user = await this.getUser({ id });
      if (!user) throw new NotFoundException();

      user.firstName = updateUserDto.firstName ?? user.firstName;
      user.lastName = updateUserDto.lastName ?? user.lastName;
      user.bio = updateUserDto.bio ?? user.bio;

      if (updateUserDto.newPassword) {
        if (updateUserDto.password) {
          const hashCompareResult = await compare(updateUserDto.password, user.hashPwd);

          if (hashCompareResult) {
            user.hashPwd = await createHashPwd(updateUserDto.newPassword);
          } else throw new UnauthorizedException();
        } else throw new UnauthorizedException();
      }

      if (file) {
        if (user.photoFn) {
          await FileManagementUser.removeUserPhoto(user.id, user.photoFn);
        }

        const newFile = await FileManagementUser.saveUserPhoto(user.id, file);
        await FileManagementUser.removeFromTmp(file.filename);

        user.photoFn = newFile.filename;
      }
      await user.save();

      return this.userHelperService.filter(user);
    } catch (e) {
      if (file) await FileManagementUser.removeFromTmp(file.filename);
      throw e;
    }
  }

  async remove(id: string): Promise<DeleteUserResponse> {
    if (!id) throw new BadRequestException();

    const user = await this.getUser({ id });
    if (!user) throw new NotFoundException();

    await FileManagementUser.removeUserDir(id);
    await user.remove();

    return this.userHelperService.filter(user);
  }

  async getStats(id: string): Promise<GetUserStatsResponse> {
    if (!id) throw new BadRequestException();

    const travelCount = await this.travelService.getCountByUserId(id);
    const postCount = await this.postService.getCountByUserId(id);

    return {
      travelCount,
      postCount,
    };
  }

  async getPhoto(id: string) {
    if (!id) throw new BadRequestException();

    const user = await this.getUser({ id });
    if (!user) throw new NotFoundException();

    if (user?.photoFn) {
      const filePath = FileManagementUser.getUserPhoto(id, user.photoFn);
      return createReadStream(filePath);
    }

    return createReadStream(FileManagement.storageDir('user.png'));
  }
}
