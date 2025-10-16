#!/bin/bash

# 数据备份脚本
BACKUP_DIR="/opt/backups/weather-alert-system"
APP_DIR="/opt/weather-alert-system"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.tar.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "🔄 开始备份..."

# 备份数据库
echo "📊 备份数据库..."
cp $APP_DIR/dev.db $BACKUP_DIR/dev.db_$DATE

# 备份配置文件
echo "⚙️ 备份配置文件..."
cp $APP_DIR/.env $BACKUP_DIR/.env_$DATE

# 创建完整备份
echo "📦 创建完整备份..."
tar -czf $BACKUP_DIR/$BACKUP_FILE -C $APP_DIR \
    dev.db \
    .env \
    prisma/schema.prisma \
    public/

# 清理旧备份（保留最近7天）
echo "🧹 清理旧备份..."
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "dev.db_*" -mtime +7 -delete
find $BACKUP_DIR -name ".env_*" -mtime +7 -delete

echo "✅ 备份完成: $BACKUP_DIR/$BACKUP_FILE"

# 可选：上传到云存储
# aws s3 cp $BACKUP_DIR/$BACKUP_FILE s3://your-backup-bucket/