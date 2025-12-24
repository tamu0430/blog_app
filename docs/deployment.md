# デプロイメントガイド

## 概要

このドキュメントでは、NestJSブログAPIシステムを本番環境にデプロイするための手順と設定について説明します。

## 本番環境の前提条件

### システム要件

- **Node.js**: v18.0.0以上
- **npm**: v8.0.0以上
- **MySQL**: v8.0以上
- **メモリ**: 最低512MB、推奨1GB以上
- **ストレージ**: 最低1GB、推奨5GB以上

### 必要なサービス

- **Webサーバー**: Nginx（推奨）またはApache
- **プロセスマネージャー**: PM2（推奨）
- **SSL証明書**: Let's Encrypt（推奨）
- **ログ管理**: Winston + ログローテーション

## 環境設定

### 1. 本番環境用環境変数

`.env.production`ファイルを作成：

```env
# アプリケーション設定
NODE_ENV=production
PORT=3001

# データベース設定
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USERNAME=your-production-db-user
DB_PASSWORD=your-secure-db-password
DB_NAME=blog_production

# JWT設定
JWT_SECRET_KEY=your-very-secure-production-jwt-secret

# CORS設定
CORS_ORIGIN=https://your-frontend-domain.com

# ログ設定
LOG_LEVEL=error
LOG_FILE_PATH=/var/log/blog-api/app.log
```

### 2. TypeORM本番設定

本番環境では`synchronize: false`に設定し、マイグレーションを使用：

```typescript
// app.module.ts（本番環境用設定）
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false, // 本番環境では必ずfalse
    migrations: ['dist/migrations/*.js'],
    migrationsRun: true,
    logging: ['error'], // エラーログのみ
    ssl: {
      rejectUnauthorized: false, // クラウドDBの場合
    },
  }),
  imports: [ConfigModule],
  inject: [ConfigService],
})
```

## ビルドプロセス

### 1. 依存関係のインストール

```bash
# 本番用依存関係のみインストール
npm ci --only=production

# または開発依存関係も含める場合（ビルド時）
npm ci
```

### 2. TypeScriptコンパイル

```bash
# プロダクションビルド
npm run build

# ビルド結果の確認
ls -la dist/
```

### 3. ビルド最適化

```json
// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "test",
    "dist",
    "**/*spec.ts",
    "**/*test.ts"
  ],
  "compilerOptions": {
    "removeComments": true,
    "sourceMap": false
  }
}
```

## データベースマイグレーション

### 1. マイグレーションファイルの作成

```bash
# マイグレーション生成
npm run typeorm migration:generate -- -n InitialSchema

# マイグレーションファイルの確認
ls -la src/migrations/
```

### 2. 本番環境でのマイグレーション実行

```bash
# マイグレーション実行
npm run typeorm migration:run

# マイグレーション状態確認
npm run typeorm migration:show
```

### 3. マイグレーション戦略

```typescript
// package.json にスクリプト追加
{
  "scripts": {
    "migration:generate": "typeorm migration:generate",
    "migration:run": "typeorm migration:run",
    "migration:revert": "typeorm migration:revert",
    "migration:show": "typeorm migration:show"
  }
}
```

## PM2を使用したプロセス管理

### 1. PM2インストール

```bash
# PM2をグローバルインストール
npm install -g pm2
```

### 2. PM2設定ファイル

`ecosystem.config.js`を作成：

```javascript
module.exports = {
  apps: [{
    name: 'blog-api',
    script: 'dist/main.js',
    instances: 'max', // CPUコア数に応じて自動調整
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '.env.production',
    log_file: '/var/log/blog-api/combined.log',
    out_file: '/var/log/blog-api/out.log',
    error_file: '/var/log/blog-api/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 3. PM2コマンド

```bash
# アプリケーション起動
pm2 start ecosystem.config.js

# ステータス確認
pm2 status

# ログ確認
pm2 logs blog-api

# アプリケーション再起動
pm2 restart blog-api

# アプリケーション停止
pm2 stop blog-api

# PM2プロセス一覧
pm2 list

# PM2の自動起動設定
pm2 startup
pm2 save
```

## Nginxリバースプロキシ設定

### 1. Nginx設定ファイル

`/etc/nginx/sites-available/blog-api`：

```nginx
server {
    listen 80;
    server_name your-api-domain.com;
    
    # HTTPSへのリダイレクト
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-api-domain.com;
    
    # SSL証明書設定
    ssl_certificate /etc/letsencrypt/live/your-api-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-api-domain.com/privkey.pem;
    
    # SSL設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # ログ設定
    access_log /var/log/nginx/blog-api.access.log;
    error_log /var/log/nginx/blog-api.error.log;
    
    # リバースプロキシ設定
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # タイムアウト設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静的ファイルのキャッシュ設定
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Nginx設定の有効化

```bash
# 設定ファイルのシンボリックリンク作成
sudo ln -s /etc/nginx/sites-available/blog-api /etc/nginx/sites-enabled/

# 設定ファイルのテスト
sudo nginx -t

# Nginx再起動
sudo systemctl restart nginx
```

## SSL証明書の設定

### 1. Let's Encryptを使用

```bash
# Certbotインストール
sudo apt update
sudo apt install certbot python3-certbot-nginx

# SSL証明書取得
sudo certbot --nginx -d your-api-domain.com

# 自動更新の設定
sudo crontab -e
# 以下を追加
0 12 * * * /usr/bin/certbot renew --quiet
```

## ログ管理

### 1. Winston設定

```typescript
// logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const winstonConfig = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: '/var/log/blog-api/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new winston.transports.DailyRotateFile({
      filename: '/var/log/blog-api/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});
```

### 2. ログローテーション

```bash
# logrotateの設定
sudo nano /etc/logrotate.d/blog-api
```

```
/var/log/blog-api/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## モニタリング

### 1. ヘルスチェックエンドポイント

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

### 2. PM2モニタリング

```bash
# PM2 Webモニタリング
pm2 install pm2-server-monit

# PM2 Plus（クラウドモニタリング）
pm2 link <secret_key> <public_key>
```

## セキュリティ設定

### 1. ファイアウォール設定

```bash
# UFWファイアウォール設定
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3001  # 直接アクセスを拒否
```

### 2. 環境変数の保護

```bash
# .env.productionファイルの権限設定
chmod 600 .env.production
chown app:app .env.production
```

### 3. セキュリティミドルウェア

```typescript
// main.ts
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // セキュリティヘッダー
  app.use(helmet());
  
  // レスポンス圧縮
  app.use(compression());
  
  // レート制限
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 最大100リクエスト
  }));
  
  await app.listen(3001);
}
```

## デプロイメント自動化

### 1. デプロイスクリプト

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# 最新コードの取得
git pull origin main

# 依存関係のインストール
npm ci --only=production

# ビルド
npm run build

# マイグレーション実行
npm run migration:run

# PM2でアプリケーション再起動
pm2 restart blog-api

echo "Deployment completed successfully!"
```

### 2. GitHub Actionsを使用したCI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/blog-api
          ./deploy.sh
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. メモリ不足

```bash
# Node.jsのメモリ制限を増加
node --max-old-space-size=2048 dist/main.js

# PM2での設定
max_memory_restart: '2G'
```

#### 2. データベース接続エラー

```bash
# 接続プールの設定
extra: {
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
}
```

#### 3. SSL証明書の更新

```bash
# 証明書の更新テスト
sudo certbot renew --dry-run

# 手動更新
sudo certbot renew
```

## パフォーマンス最適化

### 1. データベース最適化

```sql
-- インデックスの追加
CREATE INDEX idx_posts_created_at ON posts(createdAt);
CREATE INDEX idx_posts_author_id ON posts(athor_id);

-- クエリキャッシュの有効化
SET GLOBAL query_cache_type = ON;
SET GLOBAL query_cache_size = 268435456; -- 256MB
```

### 2. アプリケーション最適化

```typescript
// キャッシュの実装
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5分
      max: 100, // 最大100アイテム
    }),
  ],
})
export class AppModule {}
```

## バックアップ戦略

### 1. データベースバックアップ

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mysql"
DB_NAME="blog_production"

# データベースダンプ
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/blog_$DATE.sql

# 古いバックアップの削除（30日以上）
find $BACKUP_DIR -name "blog_*.sql" -mtime +30 -delete

echo "Backup completed: blog_$DATE.sql"
```

### 2. 自動バックアップの設定

```bash
# crontabに追加
0 2 * * * /path/to/backup.sh
```
