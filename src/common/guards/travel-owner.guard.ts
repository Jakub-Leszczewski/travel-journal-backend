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

/**
 * Allows only if authenticated user is travel's owner
 *
 * **req.param.id** --> travel's id
 * */
export class TravelOwnerGuard implements CanActivate {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const travelId = request.params?.id;

    if (!travelId) throw new BadRequestException();
    if (!user) throw new Error('user is undefined');

    const travel = await this.dataSource
      .createQueryBuilder()
      .select(['travel.id', 'user.id'])
      .from(Travel, 'travel')
      .leftJoin('travel.user', 'user')
      .where('travel.id=:travelId', { travelId })
      .getOne();

    if (!travel) throw new NotFoundException();

    return travel.user.id === user.id;
  }
}
