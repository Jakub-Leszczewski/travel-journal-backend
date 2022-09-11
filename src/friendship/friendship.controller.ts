import { Controller, Patch, Param, Delete, Inject, forwardRef, UseGuards } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { DeleteFriendshipResponse, UpdateFriendshipResponse } from '../types';
import { FriendshipOnlyInvitedGuard } from '../common/guards/friendship-only-invited.guard';
import { FriendshipOwnerGuard } from '../common/guards/friendship-owner.guard';

@Controller('/friendship')
export class FriendshipController {
  constructor(
    @Inject(forwardRef(() => FriendshipService)) private readonly friendService: FriendshipService,
  ) {}

  @Patch('/:id')
  @UseGuards(FriendshipOnlyInvitedGuard)
  accept(@Param('id') id: string): Promise<UpdateFriendshipResponse> {
    return this.friendService.accept(id);
  }

  @Delete('/:id')
  @UseGuards(FriendshipOwnerGuard)
  remove(@Param('id') id: string): Promise<DeleteFriendshipResponse> {
    return this.friendService.remove(id);
  }
}
