import { PartialType } from '@nestjs/mapped-types';
import { IsString, Length, Matches } from 'class-validator';
import { PutUserDto } from './put-user.dto';
import { UpdateUserDtoInterface } from '../../types';
import { password } from '../../common/constant/regEx';

export class UpdateUserDto extends PartialType(PutUserDto) implements UpdateUserDtoInterface {
  @IsString()
  @Length(2, 64)
  public firstName: string;

  @IsString()
  @Length(2, 64)
  public lastName: string;

  @IsString()
  @Length(0, 512)
  public bio: string;

  @IsString()
  public password: string;

  @IsString()
  @Length(8, 36)
  @Matches(password)
  public newPassword: string;

  public photo: any;
}
