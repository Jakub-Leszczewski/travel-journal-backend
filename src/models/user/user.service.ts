import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { compare, hash } from 'bcrypt';
import {
  CreateUserResponse,
  DeleteUserResponse,
  GetUserResponse,
  UpdateUserResponse,
} from '../../types/user/user-response';
import { createHashPwd } from '../../utils/create-hash-pwd';
import { UserSaveResponseData } from '../../types';

@Injectable()
export class UserService {
  async create(createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    await this.checkUserFieldUniquenessAndThrow({ email: createUserDto.email });
    await this.checkUserFieldUniquenessAndThrow({
      username: createUserDto.username,
    });

    const user = new User();
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    user.username = createUserDto.username;
    user.email = createUserDto.email;
    user.hashPwd = await createHashPwd(createUserDto.password);

    await user.save();

    return this.filter(user);
  }

  async findOne(id: string): Promise<GetUserResponse> {
    const user = await User.findOne({ where: { id } });
    if (!user) throw new NotFoundException();

    return this.filter(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResponse> {
    const user = await User.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    user.firstName = updateUserDto.firstName ?? user.firstName;
    user.lastName = updateUserDto.lastName ?? user.lastName;

    if (updateUserDto.newPassword) {
      if (updateUserDto.password) {
        const hashCompareResult = await compare(
          updateUserDto.password,
          user.hashPwd,
        );

        if (hashCompareResult) {
          user.hashPwd = await createHashPwd(updateUserDto.newPassword);
        } else throw new UnauthorizedException();
      } else throw new UnauthorizedException();
    }

    await user.save();

    return this.filter(user);
  }

  async remove(id: string): Promise<DeleteUserResponse> {
    const user = await User.findOne({ where: { id } });
    if (!user) throw new NotFoundException();

    await user.remove();

    return this.filter(user);
  }

  async checkUserFieldUniquenessAndThrow(value: {
    [key: string]: any;
  }): Promise<void> {
    const user = await User.findOne({
      where: value,
    });

    const [key] = Object.keys(value);
    if (user) throw new ConflictException(`${key} is not unique`);
  }

  async checkUserFieldUniqueness(value: {
    [key: string]: any;
  }): Promise<boolean> {
    const user = await User.findOne({
      where: value,
    });

    return !user;
  }

  filter(userEntity: User): UserSaveResponseData {
    const { jwtId, hashPwd, ...userResponse } = userEntity;

    return userResponse;
  }
}
