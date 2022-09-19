import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity';
import { DataSource } from 'typeorm';
import { Friendship } from '../../friendship/entities/friendship.entity';
import { FriendshipStatus } from '../../types';

/**
 * Allows only if authenticated user is user's owner or he is a friend of the user's owner
 *
 * **req.param.id** --> user's id
 * */
@Injectable()
export class FriendsAndOwnerGuard implements CanActivate {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const ownerId = request.params?.id;
    const user = request.user as User;

    if (!ownerId) throw new BadRequestException();
    if (!user) throw new Error('User is undefined');

    const friendship = await Friendship.findOne({
      where: {
        user: { id: ownerId },
        status: FriendshipStatus.Accepted,
      },
      relations: ['friend'],
    });
    if (!friendship && user.id !== ownerId) throw new NotFoundException();
    //@TODO zamienić we wszystki ^
    return user.id === ownerId || user.id === friendship.friend.id;
  }
}
