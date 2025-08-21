# データベース設定

## 概要

このプロジェクトでは、TypeORMを使用してMySQLデータベースと連携しています。TypeORMは、TypeScriptとJavaScriptのためのオブジェクトリレーショナルマッピング（ORM）ライブラリです。

## データベース設定

### TypeORM設定

`app.module.ts`でのTypeORM設定：

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
    // ↓これあるとDBに自動でマイグレートされる！
    // 本番ではfalseにしといたほうが安心っぽい
    synchronize: true,
  }),
  imports: [ConfigModule],
  inject: [ConfigService],
})
```

### 環境変数

`.env`ファイルで以下の変数を設定：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=blog_db
```

## エンティティ定義

### User エンティティ

```typescript
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['username', 'email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;
}
```

#### フィールド説明

- **id**: 主キー（自動生成）
- **username**: ユーザー名（一意制約）
- **name**: 表示名
- **email**: メールアドレス（一意制約）
- **password**: パスワード（ハッシュ化推奨）

### Post エンティティ

```typescript
import { User } from 'src/users/users.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => User, (user) => user.id)
  // NOTE: Postテーブル内で外部キーとして使用されるカラムがathor_id
  //       この場合、Userテーブルのidカラムが参照される
  //       Userテーブルの別のカラムを参照したい場合、referencedColumnName: 'xx_id'と指定する
  @JoinColumn({ name: 'athor_id' })
  author: User;

  @Column('text')
  content: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
```

#### フィールド説明

- **id**: 主キー（自動生成）
- **title**: 投稿タイトル
- **author**: 投稿者（Userエンティティへの外部キー）
- **content**: 投稿内容（TEXT型）
- **createdAt**: 作成日時
- **updatedAt**: 更新日時

#### リレーション詳細

- **ManyToOne**: 多対一の関係（多くの投稿が一人のユーザーに属する）
- **JoinColumn**: 外部キーカラム名を`athor_id`として指定
- **参照先**: Userテーブルの`id`カラム

## データベーススキーマ

### テーブル構造

#### users テーブル

```sql
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  UNIQUE KEY `IDX_username_email` (`username`, `email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### posts テーブル

```sql
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `athor_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_posts_author` (`athor_id`),
  CONSTRAINT `FK_posts_author` FOREIGN KEY (`athor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## リポジトリパターン

### サービスでのリポジトリ使用

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userData);
    return this.userRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
```

### よく使用するクエリパターン

#### 1. 基本的なCRUD操作

```typescript
// 作成
const user = this.userRepository.create({ username, email, password });
await this.userRepository.save(user);

// 読み取り
const user = await this.userRepository.findOne({ where: { id } });
const users = await this.userRepository.find();

// 更新
await this.userRepository.update(id, { name: 'New Name' });

// 削除
await this.userRepository.delete(id);
```

#### 2. リレーションを含むクエリ

```typescript
// 投稿と作成者を一緒に取得
const posts = await this.postRepository.find({
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

// 特定ユーザーの投稿を取得
const userPosts = await this.postRepository.find({
  where: { author: { id: userId } },
  relations: ['author'],
});
```

#### 3. 条件付きクエリ

```typescript
// 複数条件での検索
const posts = await this.postRepository.find({
  where: [
    { title: Like('%keyword%') },
    { content: Like('%keyword%') },
  ],
  order: { createdAt: 'DESC' },
  take: 10,
  skip: 0,
});
```

## マイグレーション

### 開発環境

現在は`synchronize: true`を使用しているため、エンティティの変更が自動的にデータベースに反映されます。

### 本番環境での推奨設定

```typescript
// 本番環境では synchronize: false にして、マイグレーションを使用
{
  synchronize: false,
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
}
```

### マイグレーションファイルの生成

```bash
# マイグレーションファイル生成
npm run typeorm migration:generate -- -n CreateUserTable

# マイグレーション実行
npm run typeorm migration:run

# マイグレーション取り消し
npm run typeorm migration:revert
```

## インデックス最適化

### パフォーマンス向上のためのインデックス

```typescript
@Entity()
@Index(['username', 'email']) // 複合インデックス
@Index(['createdAt']) // 単一カラムインデックス
export class User {
  // エンティティ定義
}
```

### よく使用される検索パターンに対するインデックス

```sql
-- ユーザー名での検索
CREATE INDEX idx_users_username ON users(username);

-- メールアドレスでの検索
CREATE INDEX idx_users_email ON users(email);

-- 投稿の作成日時での並び替え
CREATE INDEX idx_posts_created_at ON posts(createdAt);

-- 作成者別の投稿検索
CREATE INDEX idx_posts_author_id ON posts(athor_id);
```

## セキュリティ考慮事項

### 1. パスワードハッシュ化

```typescript
import * as bcrypt from 'bcrypt';

// パスワードハッシュ化
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// パスワード検証
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. SQLインジェクション対策

TypeORMのパラメータ化クエリを使用することで、SQLインジェクションを防止できます：

```typescript
// ✅ 安全（パラメータ化クエリ）
const user = await this.userRepository.findOne({
  where: { username: userInput }
});

// ❌ 危険（生のSQL）
const user = await this.userRepository.query(
  `SELECT * FROM users WHERE username = '${userInput}'`
);
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. 接続エラー

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**解決方法**:
- MySQLサーバーが起動していることを確認
- 接続情報（ホスト、ポート、認証情報）を確認

#### 2. 文字化け問題

**解決方法**:
- データベースとテーブルの文字セットを`utf8mb4`に設定
- 接続時の文字セット指定

#### 3. 外部キー制約エラー

**解決方法**:
- 参照先のレコードが存在することを確認
- カスケード設定の確認

```typescript
@ManyToOne(() => User, { onDelete: 'CASCADE' })
author: User;
```
