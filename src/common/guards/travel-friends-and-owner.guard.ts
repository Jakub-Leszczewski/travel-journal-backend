import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity';
import { Travel } from '../../travel/entities/travel.entity';
import { DataSource } from 'typeorm';
import { Friendship } from '../../friendship/entities/friendship.entity';
import { FriendshipStatus } from '../../types';

/**
 * Allows only if authenticated user is travel's owner or he is a friend of the travel's owner
 *
 * **req.param.id** --> travel's id
 * */
export class TravelFriendsAndOwnerGuard implements CanActivate {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const travelId = request.params?.id;

    if (!travelId) throw new BadRequestException();
    if (!user) throw new Error('user is undefined');

    const travelSimple = await this.dataSource
      .createQueryBuilder()
      .select(['travel.id', 'user.id'])
      .from(Travel, 'travel')
      .leftJoin('travel.user', 'user')
      .where('travel.id=:travelId', { travelId })
      .getOne();

    if (!travelSimple) throw new NotFoundException();

    const friendship = await Friendship.findOne({
      where: {
        user: { id: travelSimple.user.id },
        status: FriendshipStatus.Accepted,
      },
      relations: ['friend'],
    });
    if (!friendship && user.id !== travelSimple.user.id) throw new NotFoundException();

    return travelSimple.user.id === user.id || friendship.friend.id === user.id;
  }
}
