import { FriendStatus } from './friend';

export interface CreateFriendDtoInterface {
  friendId: string;
}

export interface FindFriendsQueryDtoInterface {
  status: FriendStatus[];
  page: number;
}

export interface searchNewFriendsDtoInterface {
  search: string;
  page: number;
}
