import { CreateFriendshipDtoInterface } from '../../types';
import { IsString, Length } from 'class-validator';

export class CreateFriendDto implements CreateFriendshipDtoInterface {
  @IsString()
  @Length(36, 36)
  public friendId: string;
}
