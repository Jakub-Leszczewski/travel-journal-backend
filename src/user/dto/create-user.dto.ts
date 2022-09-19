import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { CreateUserDtoInterface } from '../../types';

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
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  public password: string;

  public photo: any;
}
