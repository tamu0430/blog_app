# 開発ガイド

## プロジェクト構造

### ディレクトリ構成

```
apps/backend/
├── src/
│   ├── app.module.ts          # ルートモジュール
│   ├── main.ts               # アプリケーションエントリーポイント
│   ├── auth/                 # 認証機能
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   └── dto/
│   ├── users/                # ユーザー管理
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.entity.ts
│   │   └── dto/
│   └── posts/                # ブログ投稿
│       ├── posts.module.ts
│       ├── posts.service.ts
│       ├── posts.controller.ts
│       ├── posts.entity.ts
│       └── dto/
├── test/                     # E2Eテスト
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## コーディング規約

### TypeScript設定

プロジェクトは厳密なTypeScript設定を使用しています：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### コードスタイル

#### 1. ファイル命名規則

- **モジュール**: `feature.module.ts`
- **サービス**: `feature.service.ts`
- **コントローラー**: `feature.controller.ts`
- **エンティティ**: `feature.entity.ts`
- **DTO**: `create-feature.dto.ts`, `update-feature.dto.ts`

#### 2. クラス命名規則

```typescript
// ✅ 良い例
export class PostsController {}
export class UsersService {}
export class AuthGuard {}

// ❌ 悪い例
export class postController {}
export class userservice {}
```

#### 3. インポート順序

```typescript
// 1. Node.js標準ライブラリ
import * as path from 'path';

// 2. 外部ライブラリ
import { Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 3. 内部モジュール
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
```

## NestJSアーキテクチャパターン

### 1. モジュール設計

各機能は独立したモジュールとして設計します：

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService], // 他のモジュールで使用する場合
})
export class PostsModule {}
```

### 2. 依存性注入

NestJSの依存性注入を活用します：

```typescript
@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}
}
```

### 3. DTO（Data Transfer Object）

APIの入出力データ検証にDTOを使用します：

```typescript
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  authorId: number;
}
```

## テスト戦略

### 1. 単体テスト

各サービスとコントローラーに対して単体テストを作成します：

```typescript
describe('PostsService', () => {
  let service: PostsService;
  let repository: Repository<Post>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### 2. E2Eテスト

APIエンドポイントの統合テストを実装します：

```typescript
describe('PostsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/posts (GET)', () => {
    return request(app.getHttpServer())
      .get('/posts')
      .expect(200)
      .expect('Content-Type', /json/);
  });
});
```

### 3. テスト実行

```bash
# 単体テスト
npm run test

# 特定のファイルのテスト
npm run test -- posts.service.spec.ts

# ウォッチモード
npm run test:watch

# E2Eテスト
npm run test:e2e

# カバレッジ
npm run test:cov
```

## デバッグ

### 1. ログ出力

NestJSの組み込みロガーを使用します：

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  async findAll(): Promise<Post[]> {
    this.logger.log('Finding all posts');
    try {
      const posts = await this.postRepository.find();
      this.logger.log(`Found ${posts.length} posts`);
      return posts;
    } catch (error) {
      this.logger.error('Error finding posts', error.stack);
      throw error;
    }
  }
}
```

### 2. VS Code デバッグ設定

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/backend/src/main.ts",
      "outFiles": ["${workspaceFolder}/apps/backend/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## パフォーマンス最適化

### 1. データベースクエリ最適化

```typescript
// ✅ 良い例: 必要なフィールドのみ選択
async findPostsWithAuthor(): Promise<Post[]> {
  return this.postRepository.find({
    relations: ['author'],
    select: {
      id: true,
      title: true,
      content: true,
      author: {
        id: true,
        username: true,
        name: true,
      },
    },
  });
}

// ❌ 悪い例: N+1問題
async findPostsWithAuthorBad(): Promise<Post[]> {
  const posts = await this.postRepository.find();
  for (const post of posts) {
    post.author = await this.userRepository.findOne({
      where: { id: post.authorId },
    });
  }
  return posts;
}
```

### 2. キャッシュ戦略

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PostsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(): Promise<Post[]> {
    const cacheKey = 'all_posts';
    let posts = await this.cacheManager.get<Post[]>(cacheKey);
    
    if (!posts) {
      posts = await this.postRepository.find();
      await this.cacheManager.set(cacheKey, posts, 300); // 5分間キャッシュ
    }
    
    return posts;
  }
}
```

## エラーハンドリング

### 1. カスタム例外

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class PostNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Post with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
```

### 2. グローバル例外フィルター

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
```

## 開発ワークフロー

### 1. 新機能開発の流れ

1. **ブランチ作成**: `git checkout -b feature/new-feature`
2. **エンティティ作成**: データモデルの定義
3. **DTO作成**: 入出力データの型定義
4. **サービス実装**: ビジネスロジックの実装
5. **コントローラー実装**: APIエンドポイントの実装
6. **テスト作成**: 単体テスト・E2Eテストの実装
7. **ドキュメント更新**: API仕様書の更新

### 2. コードレビューチェックリスト

- [ ] TypeScriptの型安全性
- [ ] エラーハンドリングの実装
- [ ] テストカバレッジの確保
- [ ] セキュリティ考慮事項
- [ ] パフォーマンスの最適化
- [ ] ドキュメントの更新

## 便利なコマンド

```bash
# 新しいモジュール生成
nest generate module posts

# 新しいサービス生成
nest generate service posts

# 新しいコントローラー生成
nest generate controller posts

# 新しいガード生成
nest generate guard auth

# プロジェクト情報表示
nest info
```
