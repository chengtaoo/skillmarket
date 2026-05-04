# 私有化技能市场 - 快速开始

## 📦 系统要求

- Node.js 18+
- npm 或 bun

## 🚀 快速启动

### 1. 安装依赖

```bash
cd /home/agent/cow/websites/skillmarket/server
npm install
```

### 2. 启动服务器

```bash
npm start
# 或开发模式（文件变更自动重启）
npm run dev
```

### 3. 访问系统

- **前端地址**: http://localhost:3000
- **协议端点**: http://localhost:3000/.well-known/skillmarket

### 4. 默认管理员账号

- 用户名: `admin`
- 密码: `admin123`

> ⚠️ **重要**: 请在生产环境中修改默认密码！

## 🔧 生产环境配置

### 环境变量

在 `server/` 目录创建 `.env` 文件：

```bash
# JWT 密钥（必改！）
JWT_SECRET=your-super-secret-key-here

# 端口（默认3000）
PORT=3000
```

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name skillmarket

# 查看状态
pm2 status

# 查看日志
pm2 logs skillmarket

# 开机自启
pm2 save
pm2 startup
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### HTTPS 配置（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

## 📱 客户端配置

### OpenClaw

创建/编辑 `~/.clawhub/config.json`:

```json
{
  "default_market": "http://your-server:3000",
  "markets": ["http://your-server:3000"]
}
```

### Cherry Studio

1. 打开设置
2. 找到「技能市场」配置
3. 添加你的私有市场地址: `http://your-server:3000`

### 自定义客户端

使用 REST API:

```bash
# 搜索技能
curl http://localhost:3000/api/v1/search?q=搜索

# 安装技能
curl -X POST http://localhost:3000/api/v1/install \
  -H "Content-Type: application/json" \
  -d '{"slug": "multi-search-engine", "clientType": "my-app"}'
```

## 📂 数据存储

- **数据库**: `server/data/skillmarket.db` (SQLite)
- **上传文件**: `server/uploads/`

## 🛠️ 常用命令

### 查看所有技能

```bash
curl http://localhost:3000/api/skills
```

### 查看所有分类

```bash
curl http://localhost:3000/api/categories
```

### 获取统计数据

```bash
curl http://localhost:3000/api/stats
```

## 🔐 安全建议

1. **修改默认密码**: 首次使用后立即修改
2. **使用 HTTPS**: 生产环境务必启用 HTTPS
3. **设置强 JWT_SECRET**: 使用随机字符串
4. **配置防火墙**: 只开放必要端口
5. **定期备份**: 备份 `data/skillmarket.db`

## 📞 API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/register | 注册（首个用户）|
| GET | /api/auth/me | 获取当前用户 |

### 技能接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/skills | 获取技能列表 |
| GET | /api/skills/:id | 获取单个技能 |
| POST | /api/skills | 创建技能（需管理员）|
| PUT | /api/skills/:id | 更新技能（需管理员）|
| DELETE | /api/skills/:id | 删除技能（需管理员）|
| GET | /api/skills/:id/download | 下载技能包 |
| GET | /api/skills/:id/content | 获取技能内容 |

### 客户端协议

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /.well-known/skillmarket | 服务发现 |
| GET | /api/v1/search | 客户端搜索 |
| POST | /api/v1/install | 客户端安装 |
