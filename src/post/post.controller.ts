import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Header,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PostService } from './post.service';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReadStream } from 'fs';
import { PostOwnerGuard } from '../common/guards/post-owner.guard';
import { PostFriendAndOwnerGuard } from '../common/guards/post-friend-and-owner.guard';
import { DeletePostResponse } from '../types';

@Controller('/api/post')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(@Inject(forwardRef(() => PostService)) private readonly postService: PostService) {}

  @Get('/:id')
  @UseGuards(PostFriendAndOwnerGuard)
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PostOwnerGuard)
  @UseInterceptors(FileInterceptor('photo'))
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postService.update(id, updatePostDto, file);
  }

  @Delete(':id')
  @UseGuards(PostOwnerGuard)
  remove(@Param('id') id: string): Promise<DeletePostResponse> {
    return this.postService.remove(id);
  }

  @Get('/photo/:id')
  @UseGuards(PostFriendAndOwnerGuard)
  @Header('Content-Type', 'image/webp')
  @Header('cross-origin-resource-policy', 'cross-origin')
  async getPhoto(@Param('id') id: string): Promise<ReadStream> {
    return this.postService.getPhoto(id);
  }
}
