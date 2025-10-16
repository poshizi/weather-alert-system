#!/bin/bash

# 气象预警系统VPS部署脚本
# 使用方法: ./deploy.sh [domain]

set -e

DOMAIN=${1:-"localhost"}
APP_DIR="/opt/weather-alert-system"
SERVICE_NAME="weather-alert-system"

echo "🚀 开始部署气象预警系统到 $DOMAIN"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用root权限运行此脚本"
    exit 1
fi

# 更新系统
echo "📦 更新系统包..."
apt update && apt upgrade -y

# 安装必要的软件
echo "🔧 安装必要软件..."
apt install -y curl wget git nginx certbot python3-certbot-nginx nodejs npm

# 安装PM2
echo "📊 安装PM2..."
npm install -g pm2

# 创建应用目录
echo "📁 创建应用目录..."
mkdir -p $APP_DIR
cd $APP_DIR

# 克隆或更新代码
if [ -d ".git" ]; then
    echo "🔄 更新代码..."
    git pull origin main
else
    echo "📥 克隆代码..."
    git clone https://github.com/your-username/weather-alert-system.git .
fi

# 安装依赖
echo "📦 安装依赖..."
npm ci --production

# 复制环境变量文件
if [ ! -f ".env" ]; then
    echo "⚙️ 配置环境变量..."
    cp .env.example .env
    echo "请编辑 $APP_DIR/.env 文件配置您的环境变量"
fi

# 生成Prisma客户端
echo "🗄️ 生成数据库客户端..."
npx prisma generate

# 初始化数据库
echo "🗄️ 初始化数据库..."
npx prisma db push

# 构建应用
echo "🔨 构建应用..."
npm run build

# 配置Nginx
echo "🌐 配置Nginx..."
sed "s/your-domain.com/$DOMAIN/g" nginx.conf > /etc/nginx/sites-available/weather-alert-system
ln -sf /etc/nginx/sites-available/weather-alert-system /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 获取SSL证书
echo "🔒 获取SSL证书..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# 创建systemd服务
echo "🔧 创建系统服务..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Weather Alert System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
echo "🚀 启动服务..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# 重启Nginx
echo "🌐 重启Nginx..."
systemctl restart nginx

# 设置定时任务
echo "⏰ 设置定时任务..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd $APP_DIR && npm run backup") | crontab -

echo "✅ 部署完成！"
echo "🌐 您的应用现在运行在: https://$DOMAIN"
echo "📊 PM2状态: pm2 status"
echo "📝 日志查看: pm2 logs $SERVICE_NAME"
echo "🔄 重启服务: systemctl restart $SERVICE_NAME"