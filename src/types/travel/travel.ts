import { PostInterface } from '../post';
import { UserInterface } from '../user';

export interface TravelInterface {
  id: string;
  title: string;
  description: string;
  destination: string;
  comradesCount: number;
  photoFn: string;
  startAt: Date;
  endAt: Date;
  user: UserInterface;
  posts: PostInterface[];
}

export type TravelSaveResponseData = Omit<TravelInterface, 'photoFn' | 'posts' | 'user'> & {
  photo: string;
  authorId: string;
};
