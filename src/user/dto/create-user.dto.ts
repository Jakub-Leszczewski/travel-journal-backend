import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { CreateUserDtoInterface } from '../../types';
import { password } from '../../common/constant/regEx';

export class CreateUserDto implements CreateUserDtoInterface {
  @IsString()
  @Length(2, 64)
  public firstName: string;

  @IsString()
  @Length(2, 64)
  public lastName: string;

  @IsString()
  @Length(2, 64)
  public username: string;

  @IsEmail()
  @Length(3, 255)
  public email: string;

  @IsString()
  @Length(8, 36)
  @Matches(password)
  public password: string;

  public photo?: any;
}
