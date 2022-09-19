import { TravelInterface, TravelSaveResponseData } from '../travel';
import { UserPublicDataInterface } from '../user';

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

export type ForeignPostSaveData = Omit<PostSaveResponseData, 'authorId' | 'travelId'> & {
  travel: TravelSaveResponseData;
} & {
  user: UserPublicDataInterface;
};
