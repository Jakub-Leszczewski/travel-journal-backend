import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity';
import { DataSource } from 'typeorm';
import { Friendship } from '../../friendship/entities/friendship.entity';
import { FriendshipStatus } from '../../types';

/**
 * Allows only if authenticated user is owner of friendship and it's **Invitation**
 *
 * **req.param.id** --> friendship's id
 * */
@Injectable()
export class FriendshipOnlyInvitedGuard implements CanActivate {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const friendshipId = request.params?.id;
    const user = request.user as User;

    if (!friendshipId) throw new BadRequestException();
    if (!user) throw new Error('User is undefined');

    const friendship = await Friendship.findOne({
      where: { id: friendshipId },
      relations: ['user'],
    });

    return user.id === friendship.user.id && friendship.status === FriendshipStatus.Invitation;
  }
}
