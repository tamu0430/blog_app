# 認証システム

## 概要

このブログAPIシステムでは、JWT（JSON Web Token）を使用した認証システムを実装しています。ユーザーはログイン時にJWTトークンを取得し、保護されたエンドポイントへのアクセス時にそのトークンを使用します。

## JWT認証フロー

### 1. 認証の流れ

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Auth as AuthService
    participant Users as UsersService
    participant Guard as AuthGuard
    participant API as 保護されたAPI

    Client->>Auth: ログイン要求 (username, password)
    Auth->>Users: ユーザー検索 (findOne)
    Users-->>Auth: ユーザー情報
    Auth->>Auth: パスワード検証
    Auth-->>Client: JWT トークン
    Client->>Guard: API要求 + Bearer Token
    Guard->>Guard: トークン検証
    Guard-->>API: 認証済みリクエスト
    API-->>Client: レスポンス
```

### 2. 実装詳細

#### AuthService（認証サービス）

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersServece: UsersService,
    private readonly jwtToken: JwtService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersServece.findOne(username);
    // TODO: PWのハッシュ化
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.username };

    return {
      access_token: await this.jwtToken.signAsync(payload),
    };
  }
}
```

#### UsersService（ユーザーサービス）

```typescript
import { Injectable } from '@nestjs/common';
import { User } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }
}
```

**重要**: `findOne`メソッド（13-15行目）は、JWT認証システムの中核となる機能で、ユーザー名に基づいてユーザー情報を取得します。

#### AuthGuard（認証ガード）

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload: Record<string, any> = await this.jwtService.verifyAsync(
        token,
        {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
        },
      );

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

## JWT設定

### 環境変数

```env
JWT_SECRET_KEY=your_very_secure_secret_key_here
```

**重要**: 本番環境では、十分に複雑で予測困難なシークレットキーを使用してください。

### JWT設定例

```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { 
          expiresIn: '1h', // トークンの有効期限
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
```

## 保護されたエンドポイント

### AuthGuardの使用

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('/posts')
export class PostController {
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
```

### 認証が必要なエンドポイント

- `POST /posts` - 投稿作成
- `PATCH /posts/:postId` - 投稿更新
- `DELETE /posts/:postId` - 投稿削除

### 認証が不要なエンドポイント

- `GET /posts` - 投稿一覧取得
- `GET /posts/:postId` - 投稿詳細取得
- `POST /auth/login` - ログイン

## 認証の使用方法

### 1. ログイン

```http
POST /auth/login
Content-Type: application/json

{
  "username": "user1",
  "password": "password123"
}
```

**レスポンス**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoidXNlcjEiLCJpYXQiOjE2NDIwNzI4MDAsImV4cCI6MTY0MjA3NjQwMH0.signature"
}
```

### 2. 保護されたエンドポイントへのアクセス

```http
POST /posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "新しい投稿",
  "content": "投稿内容",
  "authorId": 1
}
```

## JWTペイロード構造

### 標準ペイロード

```json
{
  "sub": 1,                    // ユーザーID（subject）
  "username": "user1",         // ユーザー名
  "iat": 1642072800,          // 発行時刻（issued at）
  "exp": 1642076400           // 有効期限（expiration）
}
```

### カスタムペイロードの追加

```typescript
// より多くの情報をペイロードに含める場合
const payload = { 
  sub: user.id, 
  username: user.username,
  email: user.email,
  roles: ['user'], // ロール情報
};
```

## セキュリティ考慮事項

### 1. パスワードハッシュ化（推奨実装）

現在はプレーンテキストでパスワードを比較していますが、本番環境では必ずハッシュ化を実装してください：

```typescript
import * as bcrypt from 'bcrypt';

// ユーザー登録時
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// ログイン時の検証
const isValidPassword = await bcrypt.compare(password, user.password);
if (!isValidPassword) {
  throw new UnauthorizedException();
}
```

### 2. トークンの有効期限

```typescript
// 短い有効期限を設定
signOptions: { 
  expiresIn: '15m', // 15分
}

// リフレッシュトークンの実装も検討
```

### 3. HTTPS の使用

本番環境では必ずHTTPSを使用してトークンの盗聴を防いでください。

### 4. トークンの保存

クライアント側でのトークン保存方法：

```javascript
// ✅ 推奨: httpOnly Cookieに保存
// サーバー側でCookieを設定

// ⚠️ 注意: LocalStorageに保存する場合
localStorage.setItem('access_token', token);

// ❌ 非推奨: SessionStorageは永続性がない
sessionStorage.setItem('access_token', token);
```

## エラーハンドリング

### 認証エラーの種類

#### 1. トークンなし

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 2. 無効なトークン

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 3. 期限切れトークン

```json
{
  "statusCode": 401,
  "message": "Token expired"
}
```

#### 4. ログイン失敗

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

## 拡張機能

### 1. ロールベースアクセス制御（RBAC）

```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 使用例
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Delete(':postId')
async removePost(@Param('postId') postId: number) {
  return this.postService.removePost(postId);
}
```

### 2. リフレッシュトークン

```typescript
// リフレッシュトークンの実装例
async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
  try {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    
    const newPayload = { sub: payload.sub, username: payload.username };
    return {
      access_token: await this.jwtService.signAsync(newPayload),
    };
  } catch {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

### 3. ログアウト機能

```typescript
// ブラックリスト機能の実装
@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens = new Set<string>();

  addToBlacklist(token: string): void {
    this.blacklistedTokens.add(token);
  }

  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
}
```

## テスト

### 認証のテスト例

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signIn', () => {
    it('should return access token for valid credentials', async () => {
      const user = { id: 1, username: 'test', password: 'password' };
      jest.spyOn(usersService, 'findOne').mockResolvedValue(user);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');

      const result = await service.signIn('test', 'password');

      expect(result).toEqual({ access_token: 'token' });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(null);

      await expect(service.signIn('test', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
```
