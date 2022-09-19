import { FriendshipSaveResponseData } from './friendship';

export type CreateFriendshipResponse = FriendshipSaveResponseData;
export type GetFriendshipsResponse = {
  friends: FriendshipSaveResponseData[];
  totalPages: number;
  totalFriendsCount: number;
};
export type UpdateFriendshipResponse = FriendshipSaveResponseData;
export type DeleteFriendshipResponse = FriendshipSaveResponseData;
