import { Controller, Patch, Param, Delete, Inject, forwardRef } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { DeleteFriendshipResponse, UpdateFriendshipResponse } from '../types';

@Controller('/friend')
export class FriendshipController {
  constructor(
    @Inject(forwardRef(() => FriendshipService)) private readonly friendService: FriendshipService,
  ) {}

  @Patch('/:id')
  update(@Param('id') id: string): Promise<UpdateFriendshipResponse> {
    return this.friendService.update(id);
  }

  @Delete('/:id')
  remove(@Param('id') id: string): Promise<DeleteFriendshipResponse> {
    return this.friendService.remove(id);
  }
}
