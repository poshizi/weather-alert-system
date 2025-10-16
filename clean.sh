#!/bin/bash

# 气象预警系统 - 项目清理脚本
# 用于创建干净的生产部署包

echo "🧹 开始清理项目..."

# 清理开发文件
echo "🗑️ 清理开发文件..."
rm -rf .next
rm -rf node_modules
rm -f dev.log
rm -f server.log
rm -f .DS_Store
rm -f *.log

# 清理测试文件
echo "🗑️ 清理测试文件..."
rm -rf test-key-props.md
rm -rf docs/smtp-setup.md
rm -rf examples/websocket
rm -rf src/scripts
rm -rf src/components/evaluation-create.tsx
rm -rf src/components/file-upload.tsx
rm -rf src/components/openai-config.tsx
rm -rf src/components/evaluation-results.tsx
rm -rf src/app/alarm-info
rm -rf src/app/api/alarm-info
rm -rf src/app/api/documents
rm -rf src/app/api/cron
rm -rf db/custom.db

# 清理缓存文件
echo "🗑️ 清理缓存文件..."
find . -name "*.cache" -delete
find . -name ".turbo" -delete
find . -name "dist" -delete

# 设置脚本权限
echo "🔧 设置脚本权限..."
chmod +x deploy.sh
chmod +x scripts/backup.sh
chmod +x clean.sh

echo "✅ 项目清理完成！"
echo "📦 项目已准备好打包部署"