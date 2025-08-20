import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('/posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts(@Query('userId') userId: number) {
    return this.postService.findPostsByUser(userId);
  }

  @Get(':postId')
  async getPost(@Param('postId') postId: number) {
    return this.postService.findPostById(postId);
  }

  @UseGuards(AuthGuard)
  @Post()
  async createPost(@Body() createPostDto: CreatePostDto) {
    return this.postService.createPost(createPostDto);
  }

  @UseGuards(AuthGuard)
  @Patch(':postId')
  async updatePost(
    @Param('postId') postId: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.updatePost(postId, updatePostDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':postId')
  async removePost(@Param('postId') postId: number) {
    return this.postService.removePost(postId);
  }
}
