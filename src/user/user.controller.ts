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
  GetFriendsResponse,
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
import { CreateFriendDto } from '../friend/dto/create-friend.dto';
import { CreateFriendResponse } from '../types';
import { FriendService } from '../friend/friend.service';
import { UserFriendAndOwnerGuard } from '../common/guards/user-friend-and-owner.guard';
import { UserOwnerGuard } from '../common/guards/user-owner.guard';
import { FindFriendsQueryDto } from '../friend/dto/find-friends-query.dto';
import { findIndexQueryDto } from './dto/find-index-query.dto';
import { SearchFriendsQueryDto } from '../friend/dto/search-friends-query.dto';
import { findTravelsQueryDto } from '../travel/dto/find-travels-query.dto';

@Controller('/user')
export class UserController {
  constructor(
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(forwardRef(() => TravelService)) private travelService: TravelService,
    @Inject(forwardRef(() => FriendService)) private friendService: FriendService,
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
  @UseGuards(JwtAuthGuard, UserFriendAndOwnerGuard)
  async findOne(@Param('id') id: string): Promise<GetUserResponse> {
    return this.userService.findOne(id);
  }

  @Get('/:id/index')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async getIndex(
    @Param('id') id: string,
    @Query() query: findIndexQueryDto,
  ): Promise<GetUserIndexResponse> {
    return this.userService.getUserIndex(id, query);
  }

  @Get('/:id/friend/search')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async searchNewFriends(
    @Param('id') id: string,
    @Query() query: SearchFriendsQueryDto,
  ): Promise<GetUserSearchResponse> {
    return this.friendService.searchNewFriends(id, query);
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
  @UseGuards(JwtAuthGuard, UserFriendAndOwnerGuard)
  async findAllTravel(
    @Param('id') id: string,
    @Query() query: findTravelsQueryDto,
  ): Promise<GetTravelsResponse> {
    return this.travelService.findAllByUserId(id, query);
  }

  @Post('/:id/travel')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createTravel(
    @Body() createTravelDto: CreateTravelDto,
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ): Promise<CreateTravelResponse> {
    return this.travelService.create(id, createTravelDto, file);
  }

  @Post('/:id/friend')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async createFriendship(
    @Body() createFriendDto: CreateFriendDto,
    @Param('id') id: string,
  ): Promise<CreateFriendResponse> {
    return this.friendService.create(id, createFriendDto);
  }

  @Get('/:id/friend')
  @UseGuards(JwtAuthGuard, UserOwnerGuard)
  async getAllFriendshipByUserId(
    @Param('id') id: string,
    @Query() query: FindFriendsQueryDto,
  ): Promise<GetFriendsResponse> {
    return this.friendService.findAllByUserId(id, query);
  }
}
