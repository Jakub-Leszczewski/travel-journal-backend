import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../user/entities/user.entity';

/**
 * Allows only if authenticated user is user's owner
 *
 * **req.param.id** --> user's id
 * */
@Injectable()
export class UserOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const ownerId = request.params?.id;

    if (!ownerId) throw new BadRequestException();
    if (!user) throw new Error('User is undefined');

    return user.id === ownerId;
  }
}
