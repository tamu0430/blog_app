# 環境構築ガイド

## 前提条件

開発を始める前に、以下のソフトウェアがインストールされていることを確認してください：

- **Node.js** (v18以上推奨)
- **npm** (Node.jsに含まれています)
- **MySQL** (v8.0以上推奨)
- **Git**

## プロジェクトセットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd blog_app
```

### 2. 依存関係のインストール

```bash
npm install
```

このコマンドにより、`package.json`に定義されたすべての依存関係がインストールされます。

### 3. 環境変数の設定

プロジェクトルートに`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# データベース設定
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=blog_db

# JWT設定
JWT_SECRET_KEY=your_very_secure_secret_key_here

# CORS設定
CORS_ORIGIN=http://localhost:3000

# サーバーポート
PORT=3001
```

### 4. データベースの準備

MySQLサーバーを起動し、データベースを作成してください：

```sql
CREATE DATABASE blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**注意**: TypeORMの`synchronize: true`設定により、アプリケーション起動時に自動的にテーブルが作成されます。

## 開発サーバーの起動

### 基本的な起動方法

```bash
# 開発モード（推奨）
npm run start:dev

# 通常の開発モード
npm run start

# 本番モード
npm run start:prod
```

### 開発モードの特徴

`npm run start:dev`を使用すると：
- ファイル変更時の自動再起動
- ホットリロード機能
- 詳細なログ出力
- デバッグ情報の表示

### サーバー確認

サーバーが正常に起動すると、以下のURLでアクセス可能になります：

- **API サーバー**: http://localhost:3001
- **ヘルスチェック**: http://localhost:3001 (基本的なレスポンス確認)

## テストの実行

### 単体テスト

```bash
npm run test
```

### E2Eテスト

```bash
npm run test:e2e
```

### テストカバレッジ

```bash
npm run test:cov
```

カバレッジレポートは`coverage/`ディレクトリに生成されます。

## 開発ツール

### コードフォーマット

プロジェクトではPrettierを使用してコードフォーマットを統一しています：

```bash
# フォーマット実行
npm run format

# フォーマットチェック
npm run format:check
```

### リンティング

ESLintを使用してコード品質を維持しています：

```bash
# リント実行
npm run lint

# 自動修正
npm run lint:fix
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. データベース接続エラー

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**解決方法**:
- MySQLサーバーが起動していることを確認
- `.env`ファイルのデータベース設定を確認
- ファイアウォール設定を確認

#### 2. ポート使用中エラー

```
Error: listen EADDRINUSE :::3001
```

**解決方法**:
- 他のプロセスがポート3001を使用していないか確認
- `.env`ファイルでPORTを変更
- プロセスを終了: `lsof -ti:3001 | xargs kill -9`

#### 3. JWT_SECRET_KEYエラー

```
Error: JWT secret key is required
```

**解決方法**:
- `.env`ファイルに`JWT_SECRET_KEY`が設定されていることを確認
- 十分に複雑なシークレットキーを使用

### ログの確認

開発中は以下のログを確認してください：

- **アプリケーションログ**: コンソール出力
- **データベースログ**: TypeORMクエリログ
- **HTTPリクエストログ**: NestJSの組み込みロガー

## 次のステップ

環境構築が完了したら、以下のドキュメントを参照してください：

- [開発ガイド](./development.md) - コード構造とベストプラクティス
- [API仕様](./api-reference.md) - エンドポイントの詳細
- [認証システム](./authentication.md) - JWT認証の実装詳細
- [データベース](./database.md) - TypeORMとエンティティの詳細
