import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFriendDto } from './dto/create-friend.dto';
import { Friendship } from './entities/friendship.entity';
import { User } from '../user/entities/user.entity';
import { UserHelperService } from '../user/user-helper.service';
import { config } from '../config/config';
import { Brackets, DataSource, In } from 'typeorm';
import { FindFriendsQueryDto } from './dto/find-friends-query.dto';
import { SearchFriendsQueryDto } from './dto/search-friends-query.dto';
import {
  CreateFriendshipResponse,
  DeleteFriendshipResponse,
  FriendshipSaveResponseData,
  FriendshipStatus,
  GetFriendshipsResponse,
  UpdateFriendshipResponse,
  GetUserSearchResponse,
  FriendshipInterface,
} from '../types';

export type FriendshipTwoSite = {
  friendshipUser: Friendship;
  friendshipFriend: Friendship;
};

@Injectable()
export class FriendshipService {
  constructor(
    @Inject(forwardRef(() => UserHelperService)) private userHelperService: UserHelperService,
    @Inject(forwardRef(() => DataSource)) private dataSource: DataSource,
  ) {}

  async findAllByUserId(
    id: string,
    { status, page }: FindFriendsQueryDto,
  ): Promise<GetFriendshipsResponse> {
    if (!id) throw new BadRequestException();

    const [friendship, totalFriendsCount] = await Friendship.findAndCount({
      relations: ['user', 'friend'],
      where: {
        user: { id },
        status: In(status),
      },
      skip: config.itemsCountPerPage * (page - 1),
      take: config.itemsCountPerPage,
    });

    return {
      friends: friendship.map((e) => this.filter(e)),
      totalPages: Math.ceil(totalFriendsCount / config.itemsCountPerPage),
      totalFriendsCount,
    };
  }

  async invite(userId: string, { friendId }: CreateFriendDto): Promise<CreateFriendshipResponse> {
    if (!userId || !friendId) throw new BadRequestException();

    await this.checkFriendshipExistAndThrow(userId, friendId);

    const user = await User.findOne({ where: { id: userId } });
    const friend = await User.findOne({ where: { id: friendId } });
    if (!user || !friend) throw new NotFoundException();

    const friendship = new Friendship();
    friendship.status = FriendshipStatus.Waiting;
    await friendship.save();

    friendship.user = user;
    friendship.friend = friend;
    await friendship.save();

    const friendshipRevert = new Friendship();
    friendshipRevert.status = FriendshipStatus.Invitation;
    await friendshipRevert.save();

    friendshipRevert.user = friend;
    friendshipRevert.friend = user;
    await friendshipRevert.save();

    return this.filter(friendship);
  }

  async accept(id: string): Promise<UpdateFriendshipResponse> {
    if (!id) throw new BadRequestException();

    const { friendshipUser, friendshipFriend } = await this.getFriendshipTwoSides({ id });

    if (!friendshipUser || !friendshipFriend) throw new NotFoundException();

    friendshipUser.status = FriendshipStatus.Accepted;
    friendshipFriend.status = FriendshipStatus.Accepted;

    await friendshipUser.save();
    await friendshipFriend.save();

    return this.filter(friendshipUser);
  }

  async remove(id: string): Promise<DeleteFriendshipResponse> {
    if (!id) throw new BadRequestException();

    const { friendshipUser, friendshipFriend } = await this.getFriendshipTwoSides({ id });

    if (friendshipUser) await friendshipUser.remove();
    if (friendshipFriend) await friendshipFriend.remove();

    return this.filter(friendshipUser);
  }

  async checkFriendshipExist(userId: string, friendId: string): Promise<boolean> {
    return !!(await this.getFriendshipTwoSidesByIds(userId, friendId));
  }

  async checkFriendshipExistAndThrow(userId: string, friendId: string) {
    const friendshipExist = this.checkFriendshipExist(userId, friendId);

    if (friendshipExist) throw new ConflictException();
  }

  async searchNewFriends(
    id: string | undefined,
    { page, search }: SearchFriendsQueryDto,
  ): Promise<GetUserSearchResponse> {
    if (!search || search.length < 2)
      return {
        users: [],
        totalPages: 0,
        totalUsersCount: 0,
      };

    const [users, totalUsersCount] = await this.dataSource
      .createQueryBuilder()
      .select(['user'])
      .from(User, 'user')
      .where('user.username LIKE :search', { search: `%${search ?? ''}%` })
      .andWhere(
        new Brackets((qb) =>
          qb.where((qb) => {
            const subQuery = qb
              .subQuery()
              .select(['friend.id'])
              .from(User, 'friend')
              .leftJoin('friend.friendsRevert', 'friendship')
              .leftJoin('friendship.user', 'user')
              .where('user.id=:id', { id })
              .getQuery();

            return 'NOT user.id IN' + subQuery;
          }),
        ),
      )
      .andWhere('user.id <> :id', { id })
      .skip(config.itemsCountPerPage * (page - 1))
      .take(config.itemsCountPerPage)
      .getManyAndCount();

    return {
      users: users.map((e) => this.userHelperService.filterPublicData(e)),
      totalPages: Math.ceil(totalUsersCount / config.itemsCountPerPage),
      totalUsersCount,
    };
  }

  async getFriendshipTwoSidesByIds(userId: string, friendId: string): Promise<FriendshipTwoSite> {
    if (!userId || !friendId) throw new Error('userId or friendId is empty');

    const friendshipUser = await Friendship.findOne({
      where: {
        user: { id: userId },
        friend: { id: friendId },
      },
      relations: ['user', 'friend'],
    });

    const friendshipFriend = await Friendship.findOne({
      where: {
        user: { id: friendId },
        friend: { id: userId },
      },
    });

    if ((!friendshipUser && friendshipFriend) || (friendshipUser && !friendshipFriend)) {
      throw new Error(`incomplete friendship ${friendshipUser?.id} - ${friendshipFriend?.id}`);
    }

    if (!friendshipUser && !friendshipFriend) return null;

    return { friendshipUser, friendshipFriend };
  }

  async getFriendshipTwoSides(where: Partial<FriendshipInterface>): Promise<FriendshipTwoSite> {
    if (!where) throw new Error('where is empty');

    const friendship = await this.getFriendship(where);
    if (!friendship || !friendship.user || !friendship.friend) throw new NotFoundException();

    return this.getFriendshipTwoSidesByIds(friendship.user.id, friendship.friend.id);
  }

  async getFriendship(where: Partial<FriendshipInterface>): Promise<Friendship> {
    return await Friendship.findOne({
      where,
      relations: ['user', 'friend'],
    });
  }

  filter(friendship: Friendship): FriendshipSaveResponseData {
    const { user, friend, ...friendshipResponse } = friendship;

    return {
      ...friendshipResponse,
      userId: user.id,
      friend: this.userHelperService.filterPublicData(friend),
    };
  }
}
