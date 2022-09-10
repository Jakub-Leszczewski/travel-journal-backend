import { FriendshipStatus } from './friendship';

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
