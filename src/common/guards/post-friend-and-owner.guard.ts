import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity';
import { DataSource } from 'typeorm';
import { Post } from '../../post/entities/post.entity';
import { Friendship } from '../../friendship/entities/friendship.entity';
import { FriendshipStatus } from '../../types';

export class PostFriendAndOwnerGuard implements CanActivate {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const postId = request.params?.id;

    if (!postId) throw new BadRequestException();
    if (!user) throw new Error('user is undefined');

    const postSimple = await this.dataSource
      .createQueryBuilder()
      .select(['post.id', 'travel.id', 'user.id'])
      .from(Post, 'post')
      .leftJoin('post.travel', 'travel')
      .leftJoin('travel.user', 'user')
      .where('post.id=:postId', { postId })
      .getOne();

    if (!postSimple) throw new NotFoundException();

    const friend = await this.dataSource
      .createQueryBuilder()
      .select(['friend.id', 'userFriend.id'])
      .from(Friendship, 'friend')
      .leftJoin('friend.friend', 'userFriend')
      .where('friend.userId=:id', { id: postSimple.travel.user.id })
      .andWhere('friend.status=:status', { status: FriendshipStatus.Accepted })
      .getOne();

    return postSimple.travel.user.id === user.id || user.id === friend?.friend.id;
  }
}
