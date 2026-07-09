#!/bin/bash
# 灵犀部署初始化脚本：运行数据库迁移 + 种子数据
set -e

echo "⏳ 等待 PostgreSQL 就绪..."
until pg_isready -h postgres -U linxi 2>/dev/null; do
  sleep 1
done

echo "🔄 运行数据库迁移..."
npx prisma migrate deploy

echo "🌱 运行种子数据..."
npx prisma db seed 2>/dev/null || echo "（无种子脚本，跳过）"

echo "✅ 数据库初始化完成"
exec "$@"
