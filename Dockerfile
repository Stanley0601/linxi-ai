# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# 需要 devDependencies（typescript / tailwind）才能完成 next build
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY next.config.ts ./

# API Key 通过运行时环境变量注入，绝不写进镜像：
#   docker run -p 3000:3000 -e LLM_API_KEY=sk-xxx linxi-ai
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
