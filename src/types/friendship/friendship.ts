import { UserInterface, UserPublicDataInterface } from '../user';

export interface FriendshipInterface {
  id: string;
  user: UserInterface;
  friend: UserInterface;
  status: FriendshipStatus;
}

export enum FriendshipStatus {
  Waiting = 'waiting',
  Accepted = 'accepted',
  Invitation = 'invitation',
}

export type FriendshipSaveResponseData = Omit<FriendshipInterface, 'user' | 'friend'> & {
  userId: string;
  friend: UserPublicDataInterface;
};
