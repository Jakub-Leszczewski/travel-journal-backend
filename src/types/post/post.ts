import { TravelInterface } from '../travel';

export interface PostInterface {
  id: string;
  title: string;
  destination: string;
  description: string;
  createdAt: Date;
  photoFn: string;
  travel: TravelInterface;
}

export type PostSaveResponseData = Omit<PostInterface, 'photoFn' | 'travel'> & {
  photo: string;
  authorId: string;
  travelId: string;
};
