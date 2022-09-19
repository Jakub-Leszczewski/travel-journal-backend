import { BaseEntity, Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserInterface } from '../../types';
import { Travel } from '../../travel/entities/travel.entity';
import { Friendship } from '../../friendship/entities/friendship.entity';

@Entity()
export class User extends BaseEntity implements UserInterface {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: 64 })
  public firstName: string;

  @Column({ length: 64 })
  public lastName: string;

  @Column({ length: 64 })
  @Index({ unique: true })
  public username: string;

  @Column({ length: 255 })
  @Index({ unique: true })
  public email: string;

  @Column({
    default: '',
    length: 512,
  })
  public bio: string;

  @Column({
    length: 50,
    nullable: true,
    default: null,
  })
  public photoFn: string;

  @Column({ length: 64 })
  public hashPwd: string;

  @Column({
    default: null,
    nullable: true,
    length: 36,
  })
  @Index({ unique: true })
  public jwtId: string;

  @OneToMany((type) => Travel, (travel) => travel.user)
  public travels: Travel[];

  @OneToMany((type) => Friendship, (friend) => friend.user)
  public friends: Friendship[];

  @OneToMany((type) => Friendship, (friend) => friend.friend)
  public friendsRevert: Friendship[];
}
