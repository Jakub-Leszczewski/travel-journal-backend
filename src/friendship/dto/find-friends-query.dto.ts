import { FindFriendshipsQueryDtoInterface, FriendshipStatus } from '../../types';
import { IsEnum, IsInt, Min } from 'class-validator';

export class FindFriendsQueryDto implements FindFriendshipsQueryDtoInterface {
  @IsEnum(FriendshipStatus, { each: true })
  public status: FriendshipStatus[] = [
    FriendshipStatus.Accepted,
    FriendshipStatus.Waiting,
    FriendshipStatus.Invitation,
  ];

  @IsInt()
  @Min(0)
  public page: number = 1;
}
