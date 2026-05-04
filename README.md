# 🛒 私有化技能市场 (SkillMarket)

> 开箱即用的内网 AI 技能管理平台，支持一键安装到 OpenClaw、Cherry Studio、Cursor 等客户端

![Version](https://img.shields.io/badge/version-v1.0.0-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 📋 项目简介

**SkillMarket** 是一个轻量级的私有化技能市场解决方案，让企业和团队能够：

- ✅ **私有部署** - 完全掌控数据，适合内网环境
- ✅ **统一管理** - 集中管理团队技能资产
- ✅ **一键安装** - 支持多种 AI 客户端无缝接入
- ✅ **简单易用** - JSON 文件存储，无需数据库

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🔐 **管理员鉴权** | JWT Token 认证，支持用户管理 |
| 📦 **技能管理** | 上传、编辑、审核、删除技能 |
| 🔍 **智能搜索** | 分类筛选、多维度排序 |
| ⬇️ **一键下载** | 导出 `.skill.json` 技能包 |
| 📋 **安装命令** | 复制 CLI 安装命令 |
| 📊 **数据统计** | 技能数、下载数、安装数统计 |
| 📱 **多客户端支持** | OpenClaw、Cherry Studio、Cursor 等 |

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                      客户端层                            │
│  OpenClaw  │  Cherry Studio  │  Cursor  │  其他客户端   │
└────────────────────────┬────────────────────────────────┘
                         │  REST API / CLI
┌────────────────────────▼────────────────────────────────┐
│                    API 网关层                            │
│              Express.js + JWT 鉴权                       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    数据存储层                            │
│         JSON 文件 (skills.json, users.json)              │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

- **后端**: Node.js + Express.js
- **前端**: 原生 HTML/CSS/JavaScript
- **认证**: JWT (JSON Web Token)
- **存储**: JSON 文件（零依赖数据库）
- **部署**: 支持 Docker / PM2 / 直接运行

---

## 🚀 快速开始

### 方式一：直接运行（推荐）

```bash
# 1. 进入 server 目录
cd skillmarket/server

# 2. 安装依赖
npm install

# 3. 启动服务
npm start

# 4. 访问 http://localhost:3000
```

### 方式二：使用 PM2

```bash
# 全局安装 PM2
npm install -g pm2

# 启动服务
cd skillmarket/server
pm2 start server.js --name skillmarket

# 开机自启
pm2 save
pm2 startup
```

### 方式三：Docker 部署

```bash
# 构建镜像
docker build -t skillmarket .

# 运行容器
docker run -d -p 3000:3000 \
  -v ./data:/app/server/data \
  skillmarket
```

---

## 🔐 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |

> ⚠️ **首次登录后请立即修改密码！**

---

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

1. 打开 Cherry Studio 设置
2. 找到「技能市场」配置项
3. 添加私有市场地址: `http://your-server:3000`

### Cursor

在 Cursor 设置中配置技能市场地址。

### 自定义客户端

使用 REST API 集成：

```bash
# 1. 搜索技能
curl http://localhost:3000/api/v1/search?q=搜索

# 2. 获取技能详情
curl http://localhost:3000/api/skills/multi-search-engine

# 3. 下载技能包
curl -O http://localhost:3000/api/skills/multi-search-engine/download
```

---

## 📂 项目结构

```
skillmarket/
├── index.html              # 前端页面
├── README.md               # 项目文档
├── server/
│   ├── server.js           # Express 服务器
│   ├── package.json        # 依赖配置
│   └── data/               # 数据存储
│       ├── skills.json     # 技能数据
│       ├── users.json      # 用户数据
│       └── categories.json # 分类数据
└── skills/                 # 示例技能包
    ├── multi-search-engine.json
    ├── plugin-enterprise-search.json
    └── ...
```

---

## 🔌 API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册 |
| GET | `/api/auth/me` | 获取当前用户 |

### 技能接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/skills` | 获取技能列表 |
| GET | `/api/skills/:id` | 获取技能详情 |
| POST | `/api/skills` | 创建技能（管理员） |
| PUT | `/api/skills/:id` | 更新技能（管理员） |
| DELETE | `/api/skills/:id` | 删除技能（管理员） |
| GET | `/api/skills/:id/download` | 下载技能包 |

### 客户端协议

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/.well-known/skillmarket` | 服务发现 |
| GET | `/api/v1/search?q=` | 客户端搜索 |
| POST | `/api/v1/install` | 客户端安装 |

---

## ⚙️ 生产环境配置

### 环境变量

在 `server/` 目录创建 `.env` 文件：

```bash
# JWT 密钥（必改！使用随机字符串）
JWT_SECRET=your-super-secret-key-change-this

# 服务端口（默认 3000）
PORT=3000

# CORS 允许的域名
ALLOWED_ORIGINS=http://localhost:*,http://your-domain.com
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name skillmarket.your-domain.com;

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

### HTTPS（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d skillmarket.your-domain.com
```

---

## 🔒 安全建议

1. **修改默认密码** - 首次使用后立即修改
2. **使用 HTTPS** - 生产环境务必启用
3. **设置强 JWT_SECRET** - 使用随机字符串
4. **配置防火墙** - 只开放必要端口（80, 443, 3000）
5. **定期备份** - 备份 `server/data/` 目录

---

## 📦 预置技能

| 技能 | 说明 |
|------|------|
| multi-search-engine | 多搜索引擎聚合（7中文+9国际） |
| plugin-enterprise-search | 企业工商信息查询 |
| plugin-weather-query | 天气查询 |
| video-analyzer | AI 视频分析 |
| image-generation | 图像生成 |
| pptx-generator | PPT 生成 |
| stock-monitor | 股票监控预警 |
| knowledge-wiki | 知识库管理 |
| web-search | 网页搜索 |
| document-ocr | 文档 OCR 识别 |

---

## 🛠️ 开发指南

### 添加新技能

1. 登录管理后台
2. 进入「管理后台」→「上传技能」
3. 填写技能信息或上传 JSON 文件

### 技能 JSON 格式

```json
{
  "name": "技能名称",
  "slug": "skill-slug",
  "description": "技能描述",
  "version": "1.0.0",
  "author": "作者",
  "category": "分类",
  "tags": ["标签1", "标签2"],
  "content": "SKILL.md 内容...",
  "files": ["file1.md", "file2.md"],
  "installCommand": "npm install @org/skill-name",
  "requirements": ["Node.js 18+"],
  "config": {
    "key1": "value1"
  }
}
```

---

## 📄 License

MIT License - 可免费商用，欢迎 Star ⭐

---

## 🔗 相关链接

- [GitHub 仓库](https://github.com/chengtaoo/skillmarket)
- [问题反馈](https://github.com/chengtaoo/skillmarket/issues)
