import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/posts.entity';
import { UserModule } from 'src/users/users.module';
import { PostService } from './posts.service';
import { PostController } from './posts.controller';
import { AuthModule } from 'src/auth/auth.module';
import { Tag } from './entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Tag]), UserModule, AuthModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [TypeOrmModule],
})
export class PostModule {}
