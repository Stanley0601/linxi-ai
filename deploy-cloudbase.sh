#!/bin/bash
# 灵犀 - 腾讯云 CloudBase 静态部署脚本
# 用法: ./deploy-cloudbase.sh

set -e

echo "🚀 灵犀 CloudBase 静态部署"
echo "=========================="

# 1. 临时移除 API routes（静态导出不支持）
echo "📦 准备静态导出..."
if [ -d "src/app/api" ]; then
  mv src/app/api src/app/_api_disabled
  API_MOVED=true
fi

# 2. 确保 next.config 是静态导出模式
# （已在 next.config.ts 中配置 output: "export"）

# 3. 构建（使用环境变量启用静态导出）
echo "🔨 构建中..."
STATIC_EXPORT=true npm run build

# 4. 恢复 API routes
if [ "$API_MOVED" = true ]; then
  mv src/app/_api_disabled src/app/api
fi

# 5. 检查输出
if [ ! -d "out" ]; then
  echo "❌ 构建失败：out/ 目录不存在"
  exit 1
fi

echo "✅ 构建完成！out/ 目录已生成 ($(du -sh out/ | cut -f1))"
echo ""

# 6. 部署到 CloudBase
echo "☁️  部署到 CloudBase..."
ENV_ID="linxi-d2gcj01lm1b6d05c8"

if command -v tcb &> /dev/null; then
  tcb hosting deploy ./out -e "$ENV_ID"
  echo ""
  echo "✅ 部署成功！"
  echo "🌐 访问地址: https://linxi-d2gcj01lm1b6d05c8-1426415964.tcloudbaseapp.com"
else
  echo "⚠️  未检测到 tcb CLI，请先安装："
  echo "   npm install -g @cloudbase/cli"
  echo "   tcb login"
  echo ""
  echo "安装后手动执行部署："
  echo "   tcb hosting deploy ./out -e $ENV_ID"
  echo ""
  echo "或直接在 CloudBase 控制台上传 out/ 目录的内容"
  echo "🌐 目标地址: https://linxi-d2gcj01lm1b6d05c8-1426415964.tcloudbaseapp.com"
fi
