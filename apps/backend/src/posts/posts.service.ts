import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/posts.entity';
import { Repository, DataSource } from 'typeorm';
import { User } from 'src/users/users.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Tag } from './entities/tag.entity';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 指定したユーザーの記事一覧を取得
   */
  async findPostsByUser(userId: number): Promise<Post[]> {
    try {
      this.logger.log(`ユーザーID: ${userId} の記事を取得します。`);
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!userId || !user) {
        throw new NotFoundException('指定したユーザーは存在しません。');
      }

      return this.postRepository.find({
        where: { author: user },
        order: { createdAt: 'DESC' },
      });
    } catch (error: unknown) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `ユーザーID: ${userId} の記事取得に失敗しました。`,
        trace,
      );
      throw error;
    }
  }

  /**
   * 指定したIDの記事を取得
   */
  async findPostById(postId: number): Promise<Post> {
    try {
      this.logger.log(`記事ID: ${postId} の記事を取得します。`);
      const post = await this.postRepository.findOneBy({ id: postId });

      if (!post) {
        throw new NotFoundException('指定した記事は存在しません。');
      }

      return post;
    } catch (error: unknown) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(`記事ID: ${postId} の記事取得に失敗しました。`, trace);
      throw error;
    }
  }

  /**
   * 記事作成
   */
  async createPost(createPostDto: CreatePostDto): Promise<Post> {
    const { authorId, title, content, tagNames } = createPostDto;

    try {
      return await this.dataSource.transaction(async (manager) => {
        this.logger.log(`トランザクションを開始します。`);

        // NOTE: トランザクション内では、repositoryではなくmanagerを使用してエンティティの操作を行う
        const user = await manager.findOne(User, { where: { id: authorId } });
        if (!user) {
          throw new NotFoundException('指定したユーザーは存在しません。');
        }

        const tagsToSave: Tag[] = [];

        // 重複を除去
        const uniqueTagNames = [...new Set(tagNames)];

        for (const tagName of uniqueTagNames) {
          let tag = await manager.findOne(Tag, { where: { name: tagName } });

          // タグが存在しない場合は新規作成
          if (!tag) {
            this.logger.log(`新しいタグ "${tagName}" を作成します。`);
            tag = manager.create(Tag, { name: tagName });
            // 新規タグをDBに保存（IDが発番される）
            await manager.save(tag);
          } else {
            this.logger.log(`既存のタグ "${tagName}" を使用します。`);
          }

          tagsToSave.push(tag);
        }

        this.logger.log(`ユーザーID: ${authorId} の記事を作成します。`);

        const newPost = manager.create(Post, {
          title,
          content,
          author: user,
          tags: tagsToSave,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // NOTE: 中間テーブルへの保存も自動的に行われる
        return await manager.save(newPost);
      });
    } catch (error: unknown) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `ユーザーID: ${authorId} の記事作成に失敗しました。`,
        trace,
      );
      throw error;
    }
  }

  /**
   * 記事更新
   */
  async updatePost(
    postId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    try {
      this.logger.log(`記事ID: ${postId} の記事を更新します。`);
      const post = await this.postRepository.findOneBy({ id: postId });
      if (!post) {
        throw new NotFoundException('指定した記事は存在しません。');
      }

      Object.assign(post, updatePostDto, { updatedAt: new Date() });

      return await this.postRepository.save(post);
    } catch (error: unknown) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(`記事ID: ${postId} の記事更新に失敗しました。`, trace);
      throw error;
    }
  }

  /**
   * 記事削除
   */
  async removePost(id: number): Promise<void> {
    try {
      this.logger.log(`記事ID: ${id} の記事を削除します。`);
      await this.postRepository.delete(id);
    } catch (error: unknown) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(`記事ID: ${id} の記事削除に失敗しました。`, trace);
      throw error;
    }
  }
}
