# 私有化技能市场 Docker 镜像
# 使用多段构建，减少镜像大小
FROM node:18-slim AS builder

WORKDIR /app

# 复制 package 文件
COPY server/package*.json ./

# 安装依赖（使用阿里云 npm 镜像）
RUN npm install --registry=https://registry.npmmirror.com

# 复制应用代码
COPY server/ ./server/
COPY index.html ./
COPY skills/ ./skills/

# 第二阶段：生产镜像
FROM node:18-slim

WORKDIR /app

# 创建数据目录
RUN mkdir -p /app/server/data && \
    chown -R node:node /app

# 从 builder 复制 node_modules
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/index.html ./
COPY --from=builder --chown=node:node /app/skills ./skills

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# 启动命令
CMD ["node", "server/server.js"]
