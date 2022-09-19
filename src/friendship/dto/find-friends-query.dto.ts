import { FindFriendshipsQueryDtoInterface, FriendshipStatus } from '../../types';
import { IsInt, Min } from 'class-validator';
import { IsEnumArray } from '../../common/decorators/validation';

export class FindFriendsQueryDto implements FindFriendshipsQueryDtoInterface {
  @IsEnumArray(FriendshipStatus)
  public status: FriendshipStatus[] = [
    FriendshipStatus.Accepted,
    FriendshipStatus.Waiting,
    FriendshipStatus.Invitation,
  ];

  @IsInt()
  @Min(0)
  public page: number = 1;
}
