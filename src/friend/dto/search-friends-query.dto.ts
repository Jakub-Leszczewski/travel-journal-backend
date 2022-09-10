import { searchNewFriendsDtoInterface } from '../../types';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class SearchFriendsQueryDto implements searchNewFriendsDtoInterface {
  @IsInt()
  @Min(1)
  @IsOptional()
  public page: number = 1;

  @IsString()
  @Length(1, 64)
  @IsOptional()
  public search: string;
}
