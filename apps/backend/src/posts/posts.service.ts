import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './posts.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/users.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 指定したユーザーの記事一覧を取得
   */
  async findPostsByUser(userId: number): Promise<Post[]> {
    console.log(userId);
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!userId || !user) {
      throw new NotFoundException('指定したユーザーは存在しません。');
    }

    return this.postRepository.find({
      where: { author: user },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 指定したIDの記事を取得
   */
  async findPostById(postId: number): Promise<Post> {
    const post = await this.postRepository.findOneBy({ id: postId });

    if (!post) {
      throw new NotFoundException('指定した記事は存在しません。');
    }

    return post;
  }

  /**
   * 記事作成
   */
  async createPost(createPostDto: CreatePostDto): Promise<Post> {
    const { authorId, title, content } = createPostDto;

    const user = await this.userRepository.findOneBy({ id: authorId });
    if (!user) {
      throw new NotFoundException('指定したユーザーは存在しません。');
    }

    const newPost = this.postRepository.create({
      title,
      content,
      author: user,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.postRepository.save(newPost);
  }

  /**
   * 記事更新
   */
  async updatePost(
    postId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('指定した記事は存在しません。');
    }

    Object.assign(post, updatePostDto, { updatedAt: new Date() });

    return await this.postRepository.save(post);
  }

  /**
   * 記事削除
   */
  async removePost(id: number): Promise<void> {
    await this.postRepository.delete(id);
  }
}
