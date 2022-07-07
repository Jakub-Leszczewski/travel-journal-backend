import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountOwnerGuard } from '../../common/guards/account-owner.guard';
import {
  CreateUserResponse,
  DeleteUserResponse,
  GetUserResponse,
} from '../../types/user/user-response';

@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/')
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserResponse> {
    return this.userService.create(createUserDto);
  }

  @Get('/:userId')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<GetUserResponse> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard, AccountOwnerGuard)
  remove(@Param('userId') userId: string): Promise<DeleteUserResponse> {
    return this.userService.remove(userId);
  }
}
