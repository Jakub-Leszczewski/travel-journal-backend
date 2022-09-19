import { BaseEntity, Column, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FriendshipInterface, FriendshipStatus } from '../../types';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Friendship extends BaseEntity implements FriendshipInterface {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({
    type: 'enum',
    enum: FriendshipStatus,
  })
  public status: FriendshipStatus;

  @ManyToOne((type) => User, (user) => user.friends, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  public user: User;

  @ManyToOne((type) => User, (user) => user.friendsRevert, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  public friend: User;
}
