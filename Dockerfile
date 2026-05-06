# 私有化技能市场 Docker 镜像
# 构建上下文应为仓库根目录：docker build -t skillmarket .

FROM node:18-slim AS builder

# 在 server 目录执行 npm，保证 postinstall 写入 server/public/vendor
WORKDIR /app/server

COPY server/package*.json ./
COPY server/scripts ./scripts

RUN npm install --omit=dev --registry=https://registry.npmmirror.com

COPY server/ ./

WORKDIR /app
COPY index.html ./
COPY skills ./skills

FROM node:18-slim

WORKDIR /app

RUN mkdir -p /app/server/data && \
    chown -R node:node /app

COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/index.html ./
COPY --from=builder --chown=node:node /app/skills ./skills

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server/server.js"]
