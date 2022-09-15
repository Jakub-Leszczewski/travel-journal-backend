import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Header,
  UploadedFile,
  Query,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateTravelResponse,
  CreateUserResponse,
  DeleteUserResponse,
  GetTravelsResponse,
  GetUserIndexResponse,
  GetUserResponse,
  GetUserSearchResponse,
  GetUserStatsResponse,
  UpdateUserResponse,
} from '../types';
import { ReadStream } from 'fs';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { TravelService } from '../travel/travel.service';
import { CreateTravelDto } from '../travel/dto/create-travel.dto';
import { CreateFriendDto } from '../friendship/dto/create-friend.dto';
import { FriendshipService } from '../friendship/friendship.service';
import { FriendsAndOwnerGuard } from '../common/guards/friends-and-owner.guard';
import { UserOwnerGuard } from '../common/guards/user-owner.guard';
import { FindFriendsQueryDto } from '../friendship/dto/find-friends-query.dto';
import { FindIndexQueryDto } from './dto/find-index-query.dto';
import { SearchFriendsQueryDto } from '../friendship/dto/search-friends-query.dto';
import { FindTravelsQueryDto } from '../travel/dto/find-travels-query.dto';
import { CreateFriendshipResponse, GetFriendshipsResponse } from '../types';

@Controller('/user')
export class UserController {
  constructor(
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(forwardRef(() => TravelService)) private travelService: TravelService,
    @Inject(forwardRef(() => FriendshipService)) private friendshipService: FriendshipService,
  ) {}

  @Post('/')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CreateUserResponse> {
    return this.userService.create(createUserDto, file);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard, FriendsAndOwnerGuard)
  async findOne(@Param('id') id: string): Promise<GetUserResponse> {
    return this.userService.findOne(id);
  }

  @Get('/:id/index')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async getUserIndex(
    @Param('id') id: string,
    @Query() query: FindIndexQueryDto,
  ): Promise<GetUserIndexResponse> {
    return this.userService.getUserIndex(id, query);
  }

  @Get('/:id/friend/search')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async searchNewFriends(
    @Param('id') id: string,
    @Query() query: SearchFriendsQueryDto,
  ): Promise<GetUserSearchResponse> {
    return this.friendshipService.searchNewFriends(id, query);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async remove(@Param('id') id: string): Promise<DeleteUserResponse> {
    return this.userService.remove(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UpdateUserResponse> {
    return this.userService.update(id, updateUserDto, file);
  }

  @Get('/:id/stats')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async getStats(@Param('id') id: string): Promise<GetUserStatsResponse> {
    return this.userService.getStats(id);
  }

  @Get('/photo/:id')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(@Param('id') id: string): Promise<ReadStream> {
    return this.userService.getPhoto(id);
  }

  @Get('/:id/travel')
  @UseGuards(JwtAuthGuard, FriendsAndOwnerGuard)
  async findAllTravel(
    @Param('id') id: string,
    @Query() query: FindTravelsQueryDto,
  ): Promise<GetTravelsResponse> {
    return this.travelService.findAllByUserId(id, query);
  }

  @Post('/:id/travel')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createTravel(
    @Param('id') id: string,
    @Body() createTravelDto: CreateTravelDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CreateTravelResponse> {
    return this.travelService.create(id, createTravelDto, file);
  }

  @Post('/:id/friend')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async inviteFriend(
    @Param('id') id: string,
    @Body() createFriendDto: CreateFriendDto,
  ): Promise<CreateFriendshipResponse> {
    return this.friendshipService.invite(id, createFriendDto);
  }

  @Get('/:id/friend')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async getAllFriendshipByUserId(
    @Param('id') id: string,
    @Query() query: FindFriendsQueryDto,
  ): Promise<GetFriendshipsResponse> {
    return this.friendshipService.findAllByUserId(id, query);
  }
}
