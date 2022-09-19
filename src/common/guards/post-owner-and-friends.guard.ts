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

/**
 * Allows only if authenticated user is post's owner or he is a friend of the post's owner
 *
 * **req.param.id** --> post's id
 * */
export class PostOwnerAndFriendsGuard implements CanActivate {
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

    const friendship = await Friendship.findOne({
      where: {
        user: { id: postSimple.travel.user.id },
        status: FriendshipStatus.Accepted,
      },
      relations: ['friend'],
    });
    if (!friendship && user.id !== postSimple.travel.user.id) throw new NotFoundException();

    return postSimple.travel.user.id === user.id || user.id === friendship?.friend.id;
  }
}
