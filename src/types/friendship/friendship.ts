import { UserInterface, UserPublicDataInterface } from '../user';
import { FriendshipStatus } from './friendship-status';

export interface FriendshipInterface {
  id: string;
  user: UserInterface;
  friend: UserInterface;
  status: FriendshipStatus;
}

export type FriendshipSaveResponseData = Omit<FriendshipInterface, 'user' | 'friend'> & {
  userId: string;
  friend: UserPublicDataInterface;
};
