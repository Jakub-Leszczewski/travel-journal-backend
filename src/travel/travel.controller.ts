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
  UploadedFile,
  Header,
  Inject,
  forwardRef,
  Query,
} from '@nestjs/common';
import { TravelService } from './travel.service';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import {
  CreatePostResponse,
  DeleteTravelResponse,
  GetPostsResponse,
  GetTravelResponse,
  UpdateTravelResponse,
} from '../types';
import { TravelOwnerGuard } from '../common/guards/travel-owner.guard';
import { ReadStream } from 'fs';
import { CreatePostDto } from '../post/dto/create-post.dto';
import { PostService } from '../post/post.service';
import { TravelFriendsAndOwnerGuard } from '../common/guards/travel-friends-and-owner.guard';
import { FindTravelsQueryDto } from '../post/dto/find-posts-query.dto';

@Controller('/travel')
@UseGuards(JwtAuthGuard)
export class TravelController {
  constructor(
    @Inject(forwardRef(() => TravelService)) private travelService: TravelService,
    @Inject(forwardRef(() => PostService)) private postService: PostService,
  ) {}

  @Get('/:id')
  @UseGuards(TravelFriendsAndOwnerGuard)
  async findOne(@Param('id') id: string): Promise<GetTravelResponse> {
    return this.travelService.findOne(id);
  }

  @Patch('/:id')
  @UseGuards(TravelOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() updateTravelDto: UpdateTravelDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UpdateTravelResponse> {
    return this.travelService.update(id, updateTravelDto, file);
  }

  @Delete('/:id')
  @UseGuards(TravelOwnerGuard)
  async remove(@Param('id') id: string): Promise<DeleteTravelResponse> {
    return this.travelService.remove(id);
  }

  @Get('/photo/:id')
  @UseGuards(TravelFriendsAndOwnerGuard)
  @Header('Content-Type', 'image/png')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(@Param('id') id: string): Promise<ReadStream> {
    return this.travelService.getPhoto(id);
  }

  @Post('/:id/post')
  @UseGuards(TravelOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createPost(
    @Param('id') id: string,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CreatePostResponse> {
    return this.postService.create(id, createPostDto, file);
  }

  @Get('/:id/post')
  @UseGuards(TravelFriendsAndOwnerGuard)
  async findAllPosts(
    @Param('id') id: string,
    @Query() query: FindTravelsQueryDto,
  ): Promise<GetPostsResponse> {
    return this.postService.findAllByTravelId(id, query);
  }
}
