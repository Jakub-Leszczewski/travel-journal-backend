import { FriendshipStatus } from './friendship-status';

export interface CreateFriendshipDtoInterface {
  friendId: string;
}

export interface FindFriendshipsQueryDtoInterface {
  status: FriendshipStatus[];
  page: number;
}

export interface searchNewFriendshipsDtoInterface {
  search: string;
  page: number;
}
