# システムアーキテクチャ

## 概要

このブログAPIシステムは、NestJSフレームワークを基盤とした現代的なNode.jsアプリケーションです。TypeScriptで記述され、TypeORMを使用してMySQLデータベースと連携します。

## 技術スタック

### バックエンド
- **フレームワーク**: NestJS (Node.js)
- **言語**: TypeScript
- **データベース**: MySQL
- **ORM**: TypeORM
- **認証**: JWT (JSON Web Token)
- **設定管理**: @nestjs/config

### 主要な依存関係
- `@nestjs/core` - NestJSコアフレームワーク
- `@nestjs/typeorm` - TypeORM統合
- `@nestjs/jwt` - JWT認証
- `@nestjs/config` - 環境変数管理
- `cookie-parser` - Cookieパーサー
- `mysql2` - MySQLドライバー

## アーキテクチャ構成

### モジュール構造

```
AppModule (ルートモジュール)
├── ConfigModule - 環境変数管理
├── TypeOrmModule - データベース接続
├── PostModule - ブログ投稿機能
├── UserModule - ユーザー管理
└── AuthModule - 認証機能
```

### データベース設定

TypeORMは以下の設定で動作します：

```typescript
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true, // 開発環境のみ
  }),
})
```

### CORS設定

フロントエンドとの連携のため、以下のCORS設定が適用されています：

```typescript
app.enableCors({
  origin: configService.get<string>('CORS_ORIGIN'),
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

## エンティティ関係

### User エンティティ
- `id` (Primary Key)
- `username` (Unique)
- `name`
- `email` (Unique)
- `password`

### Post エンティティ
- `id` (Primary Key)
- `title`
- `content` (Text)
- `author` (User への外部キー)
- `createdAt`
- `updatedAt`

### リレーション
- User : Post = 1 : N (一人のユーザーが複数の投稿を作成可能)

## セキュリティ

### JWT認証
- Bearer Token形式でのAPI認証
- AuthGuardによる保護されたエンドポイント
- Cookie-parserによるCookie処理

### 認証フロー
1. ユーザーログイン (`/auth/login`)
2. JWT トークン発行
3. 保護されたエンドポイントへのアクセス時にトークン検証
4. ペイロードからユーザー情報を取得

## 環境変数

必要な環境変数：

```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=blog_db
JWT_SECRET_KEY=your_secret_key
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

## ディレクトリ構造

```
src/
├── app.module.ts          # ルートモジュール
├── main.ts               # アプリケーションエントリーポイント
├── auth/                 # 認証関連
│   ├── auth.module.ts
│   ├── auth.service.ts
│   └── auth.guard.ts
├── users/                # ユーザー管理
│   ├── users.module.ts
│   ├── users.service.ts
│   └── users.entity.ts
└── posts/                # ブログ投稿
    ├── posts.module.ts
    ├── posts.service.ts
    ├── posts.controller.ts
    └── posts.entity.ts
```

## パフォーマンス考慮事項

- TypeORMの`synchronize: true`は開発環境のみで使用
- 本番環境では適切なマイグレーション戦略を実装
- データベースインデックスの最適化
- JWT トークンの適切な有効期限設定
