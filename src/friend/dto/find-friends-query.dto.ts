import { FindFriendsQueryDtoInterface, FriendStatus } from '../../types';
import { IsEnum, IsInt, Min } from 'class-validator';

export class FindFriendsQueryDto implements FindFriendsQueryDtoInterface {
  @IsEnum(FriendStatus, { each: true })
  public status: FriendStatus[] = [
    FriendStatus.Accepted,
    FriendStatus.Waiting,
    FriendStatus.Invitation,
  ];

  @IsInt()
  @Min(0)
  public page: number = 1;
}
