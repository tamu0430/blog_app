# API仕様書

## 概要

このドキュメントでは、ブログAPIシステムの全エンドポイントについて詳細に説明します。APIはRESTful設計に従い、JSON形式でデータを送受信します。

## ベースURL

```
http://localhost:3001
```

## 認証

保護されたエンドポイントには、JWTトークンを使用した認証が必要です。

### 認証ヘッダー

```http
Authorization: Bearer <JWT_TOKEN>
```

## エンドポイント一覧

### 投稿（Posts）

#### 1. 投稿一覧取得

```http
GET /posts?userId={userId}
```

**説明**: 指定されたユーザーの投稿一覧を取得します。

**パラメータ**:
- `userId` (query, optional): ユーザーID

**レスポンス例**:
```json
[
  {
    "id": 1,
    "title": "初めての投稿",
    "content": "これは私の最初のブログ投稿です。",
    "author": {
      "id": 1,
      "username": "tanaka_taro",
      "name": "田中太郎"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**ステータスコード**:
- `200 OK`: 成功
- `400 Bad Request`: 無効なパラメータ

#### 2. 投稿詳細取得

```http
GET /posts/{postId}
```

**説明**: 指定されたIDの投稿詳細を取得します。

**パラメータ**:
- `postId` (path, required): 投稿ID

**レスポンス例**:
```json
{
  "id": 1,
  "title": "初めての投稿",
  "content": "これは私の最初のブログ投稿です。詳細な内容がここに表示されます。",
  "author": {
    "id": 1,
    "username": "tanaka_taro",
    "name": "田中太郎",
    "email": "tanaka@example.com"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**ステータスコード**:
- `200 OK`: 成功
- `404 Not Found`: 投稿が見つからない

#### 3. 投稿作成

```http
POST /posts
```

**認証**: 必要

**説明**: 新しい投稿を作成します。

**リクエストボディ**:
```json
{
  "title": "新しい投稿のタイトル",
  "content": "投稿の内容をここに記述します。",
  "authorId": 1
}
```

**レスポンス例**:
```json
{
  "id": 2,
  "title": "新しい投稿のタイトル",
  "content": "投稿の内容をここに記述します。",
  "author": {
    "id": 1,
    "username": "tanaka_taro",
    "name": "田中太郎"
  },
  "createdAt": "2024-01-16T14:20:00.000Z",
  "updatedAt": "2024-01-16T14:20:00.000Z"
}
```

**ステータスコード**:
- `201 Created`: 作成成功
- `400 Bad Request`: 無効なリクエストデータ
- `401 Unauthorized`: 認証が必要

#### 4. 投稿更新

```http
PATCH /posts/{postId}
```

**認証**: 必要

**説明**: 指定されたIDの投稿を更新します。

**パラメータ**:
- `postId` (path, required): 投稿ID

**リクエストボディ**:
```json
{
  "title": "更新されたタイトル",
  "content": "更新された内容"
}
```

**レスポンス例**:
```json
{
  "id": 1,
  "title": "更新されたタイトル",
  "content": "更新された内容",
  "author": {
    "id": 1,
    "username": "tanaka_taro",
    "name": "田中太郎"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-16T15:45:00.000Z"
}
```

**ステータスコード**:
- `200 OK`: 更新成功
- `400 Bad Request`: 無効なリクエストデータ
- `401 Unauthorized`: 認証が必要
- `404 Not Found`: 投稿が見つからない

#### 5. 投稿削除

```http
DELETE /posts/{postId}
```

**認証**: 必要

**説明**: 指定されたIDの投稿を削除します。

**パラメータ**:
- `postId` (path, required): 投稿ID

**レスポンス**: 空のレスポンス

**ステータスコード**:
- `204 No Content`: 削除成功
- `401 Unauthorized`: 認証が必要
- `404 Not Found`: 投稿が見つからない

### 認証（Authentication）

#### 1. ログイン

```http
POST /auth/login
```

**説明**: ユーザー認証を行い、JWTトークンを取得します。

**リクエストボディ**:
```json
{
  "username": "tanaka_taro",
  "password": "password123"
}
```

**レスポンス例**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**ステータスコード**:
- `200 OK`: ログイン成功
- `401 Unauthorized`: 認証失敗

### ユーザー（Users）

#### 1. ユーザー情報取得

```http
GET /users/{username}
```

**説明**: 指定されたユーザー名のユーザー情報を取得します。

**パラメータ**:
- `username` (path, required): ユーザー名

**レスポンス例**:
```json
{
  "id": 1,
  "username": "tanaka_taro",
  "name": "田中太郎",
  "email": "tanaka@example.com"
}
```

**注意**: パスワードは返されません。

**ステータスコード**:
- `200 OK`: 成功
- `404 Not Found`: ユーザーが見つからない

## データ型定義

### CreatePostDto

```typescript
{
  title: string;        // 必須、投稿タイトル
  content: string;      // 必須、投稿内容
  authorId: number;     // 必須、作成者ID
}
```

### UpdatePostDto

```typescript
{
  title?: string;       // 任意、投稿タイトル
  content?: string;     // 任意、投稿内容
}
```

### User

```typescript
{
  id: number;           // ユーザーID
  username: string;     // ユーザー名（一意）
  name: string;         // 表示名
  email: string;        // メールアドレス（一意）
}
```

### Post

```typescript
{
  id: number;           // 投稿ID
  title: string;        // 投稿タイトル
  content: string;      // 投稿内容
  author: User;         // 作成者情報
  createdAt: string;    // 作成日時（ISO 8601形式）
  updatedAt: string;    // 更新日時（ISO 8601形式）
}
```

## エラーレスポンス

### 標準エラー形式

```json
{
  "statusCode": 400,
  "message": "エラーメッセージ",
  "timestamp": "2024-01-16T10:30:00.000Z",
  "path": "/posts"
}
```

### よくあるエラー

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "title should not be empty",
    "content should not be empty"
  ]
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Post with ID 999 not found"
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## 使用例

### cURLでの投稿作成例

```bash
# 1. ログインしてトークンを取得
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "tanaka_taro", "password": "password123"}'

# 2. 取得したトークンで投稿を作成
curl -X POST http://localhost:3001/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "API経由での投稿",
    "content": "cURLを使用して作成した投稿です。",
    "authorId": 1
  }'
```

### JavaScriptでの使用例

```javascript
// ログイン
const loginResponse = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'tanaka_taro',
    password: 'password123'
  })
});

const { access_token } = await loginResponse.json();

// 投稿作成
const createPostResponse = await fetch('http://localhost:3001/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    title: 'JavaScript経由での投稿',
    content: 'Fetch APIを使用して作成した投稿です。',
    authorId: 1
  })
});

const newPost = await createPostResponse.json();
console.log('作成された投稿:', newPost);
```

## レート制限

現在、レート制限は実装されていませんが、本番環境では以下の制限を推奨します：

- **一般API**: 1分間に60リクエスト
- **認証API**: 1分間に5リクエスト
- **投稿作成**: 1時間に10投稿

## CORS設定

フロントエンドアプリケーションからのアクセスを許可するため、CORS設定が有効になっています：

- **許可オリジン**: 環境変数`CORS_ORIGIN`で設定
- **許可メソッド**: GET, HEAD, PUT, PATCH, POST, DELETE
- **認証情報**: 許可（credentials: true）
