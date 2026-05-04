# 私有化技能市场 Docker 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装依赖（利用 Docker 缓存）
COPY server/package*.json ./
RUN npm ci --only=production && \
    chown -R node:node /app

# 复制应用代码
COPY --chown=node:node server/ ./server/
COPY --chown=node:node index.html ./
COPY --chown=node:node skills/ ./skills/

# 创建数据目录
RUN mkdir -p /app/server/data && \
    chown -R node:node /app/server/data

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 切换到非 root 用户
USER node

# 启动命令
CMD ["node", "server/server.js"]
