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

export class TravelFriendAndOwnerGuard implements CanActivate {
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

    const friend = await this.dataSource
      .createQueryBuilder()
      .select(['friend.id', 'userFriend.id'])
      .from(Friendship, 'friend')
      .leftJoin('friend.friend', 'userFriend')
      .where('friend.userId=:id', {
        id: travelSimple.user.id,
      })
      .andWhere('friend.status="accepted"')
      .getOne();

    return travelSimple.user.id === user.id || friend.friend.id === user.id;
  }
}
