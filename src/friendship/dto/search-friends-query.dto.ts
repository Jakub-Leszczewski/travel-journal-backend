import { searchNewFriendshipsDtoInterface } from '../../types';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class SearchFriendsQueryDto implements searchNewFriendshipsDtoInterface {
  @IsInt()
  @Min(1)
  @IsOptional()
  public page: number = 1;

  @IsString()
  @Length(0, 64)
  public search: string;
}
