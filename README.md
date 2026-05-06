# SkillMarket — 私有化技能市场

面向内网与离线环境部署的轻量级 AI 技能管理平台，支持 OpenClaw、Cherry Studio、Cursor 等客户端通过 REST 协议接入。

![Version](https://img.shields.io/badge/version-v2.0.0-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## 项目简介

- **私有部署**：数据以 JSON 与本地文件形式存储，无需外接数据库。
- **统一管理**：技能发布、审核、文件附件、ZIP 导入/导出。
- **协议兼容**：提供 `/.well-known/skillmarket` 与 `/api/v1/*` 等客户端接口。

## 内网 / 离线部署说明（重要）

本仓库已针对**无法访问公网**的场景做了以下处理，避免「外网调试正常、内网白屏/无图标」的问题：

1. **前端不再使用公共 CDN**  
   页面图标依赖的 **Font Awesome** 已改为由本服务在 **`/vendor/fontawesome-free/`** 下提供静态文件（CSS + webfonts），不依赖 `bootcdn`、jsDelivr 等外链。

2. **静态资源如何生成**  
   在 `server` 目录执行 `npm install` 时，会通过 **`postinstall`** 自动执行 `scripts/copy-vendor.mjs`，将 `@fortawesome/fontawesome-free` 复制到 `server/public/vendor/`。  
   若你在完全隔离的环境中部署，请任选其一：
   - 在可联网环境完成一次 `npm install` 后，将 **`server/node_modules`** 与 **`server/public`** 一并拷贝到内网；或
   - 将 **`package-lock.json`** 与离线 npm 包/tgz 清单拷贝至内网后执行 `npm ci`（需自行准备离线 registry 或 `npm pack` 集合）。

3. **运维侧仍需联网的环节**  
   - 首次安装 Node 依赖：需能下载 npm 包（或使用离线镜像/离线拷贝 `node_modules`）。  
   - 浏览器打开管理页面本身**不再请求**除本站以外的脚本或字体。

4. **后端运行时无外网依赖**  
   服务端仅使用 `package.json` 中的 npm 依赖；启动后不会再去拉取远程脚本或样式。

## 技术栈

| 层级 | 说明 |
|------|------|
| 服务端 | Node.js 18+、Express（ES Module） |
| 认证 | JWT（`jsonwebtoken` + `bcryptjs`） |
| 存储 | `server/data/*.json` + `server/uploads/skills/<技能ID>/` |
| 前端 | 单页 `index.html`（原生 JS），静态资源在 `server/public/` |

## 快速开始（本地 / 内网）

```bash
cd server
npm install
npm start
```

浏览器访问：**http://localhost:3000**

开发时可使用：

```bash
npm run dev
```

默认管理员（首次初始化数据库后出现）：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |

**务必在生产环境修改密码，并设置下文中的 `JWT_SECRET`。**

## 环境变量

在 **`server`** 目录下创建 `.env`（服务端已加载 `dotenv`）：

```bash
# 必填：生产环境请改为足够长的随机串
JWT_SECRET=your-super-secret-key-change-this

# 监听端口，默认 3000
PORT=3000
```

> **说明**：未设置 `JWT_SECRET` 时，程序会使用内置占位密钥，**不适合生产**。

## Docker

在**仓库根目录**构建（构建上下文需包含 `index.html`、`skills/`、`server/`）：

```bash
docker build -t skillmarket .
docker run -d -p 3000:3000 \
  -e JWT_SECRET=请改为随机串 \
  -v ./data:/app/server/data \
  skillmarket
```

或使用 Compose：

```bash
docker compose up -d
```

数据目录：默认将宿主机的 `./data` 挂载到容器内 `/app/server/data`，用于持久化 `users.json`、`skills.json` 等。首次使用可在项目根目录创建空目录 `data/`。

## 项目结构

```
skillmarket/
├── index.html                 # 前端单页（由 Express 从仓库根目录提供）
├── skills/                    # 示例/参考技能 JSON（非运行时唯一数据源）
├── docker-compose.yml
├── Dockerfile
├── README.md
└── server/
    ├── server.js              # 入口
    ├── package.json
    ├── scripts/
    │   └── copy-vendor.mjs    # 将 npm 前端资源复制到 public/vendor
    ├── public/
    │   └── vendor/
    │       └── fontawesome-free/   # Font Awesome（npm install 后生成，可纳入版本库）
    ├── data/                  # 运行时 JSON 数据（用户、技能元数据、分类）
    ├── uploads/skills/      # 各技能上传的附件目录
    └── temp/                  # 上传与 ZIP 临时文件
```

## 客户端配置摘要

- **服务发现**：`GET /.well-known/skillmarket`
- **搜索**：`GET /api/v1/search?q=关键词`
- **安装（协议）**：`POST /api/v1/install`（body 含 `slug` 等）
- **Cherry Studio 等**：可将市场根地址或 `http(s)://<主机>:<端口>/.well-known/skillmarket` 填入客户端说明。

具体示例见页面「客户端配置」页签（地址会根据当前访问 `origin` 自动替换）。

## HTTP API（管理端与浏览器）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册（**仅当系统中尚未存在任何用户时**允许，用于首个管理员） |
| GET | `/api/auth/me` | 当前用户（需 Bearer Token） |
| GET | `/api/skills` | 技能列表（支持 query：`category`、`sort`、`featured`、`status` 等） |
| GET | `/api/skills/:id` | 详情（`id` 可为 UUID 或 `slug`） |
| GET | `/api/skills/:id/download` | 下载 `.skill.json` 安装包 |
| POST | `/api/skills` | 新建（管理员） |
| PUT | `/api/skills/:id` | 更新（管理员） |
| DELETE | `/api/skills/:id` | 删除（管理员） |
| POST | `/api/skills/import` | ZIP 导入（管理员） |
| GET | `/api/skills/:id/export` | ZIP 导出（管理员） |
| GET | `/api/categories` | 分类列表 |
| GET | `/api/stats` | 统计数据 |

更多路由见 `server/server.js`。

## 生产环境建议

1. 修改默认管理员密码，限制可访问来源（防火墙 / 反向代理）。
2. 使用 HTTPS 与强 `JWT_SECRET`。
3. 定期备份 **`server/data`** 与 **`server/uploads`**。
4. 若置于 Nginx 之后，请正确传递 `Host`、`X-Forwarded-*`，以便 `/.well-known` 中返回的 URL 正确。

## 许可证

MIT License。

## 相关链接

- [GitHub 仓库](https://github.com/chengtaoo/skillmarket)
- [问题反馈](https://github.com/chengtaoo/skillmarket/issues)
