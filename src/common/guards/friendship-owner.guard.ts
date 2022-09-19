import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity';
import { DataSource } from 'typeorm';
import { Friendship } from '../../friendship/entities/friendship.entity';

/**
 * Allows only if authenticated user is owner of friendship
 *
 *  * **req.param.id** --> friendship's id
 * */
@Injectable()
export class FriendshipOwnerGuard implements CanActivate {
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
    if (!friendship) throw new NotFoundException();

    return user.id === friendship.user.id;
  }
}
