# 气象预警系统部署指南

## 📋 目录
- [GitHub自动部署](#github自动部署)
- [VPS手动部署](#vps手动部署)
- [Docker部署](#docker部署)
- [云平台部署](#云平台部署)
- [环境配置](#环境配置)
- [监控和维护](#监控和维护)

## 🚀 GitHub自动部署

### 1. 准备工作
1. Fork或创建GitHub仓库
2. 在仓库设置中添加Secrets：
   - `NEXTAUTH_SECRET`: 随机密钥
   - `SERVERCHAN_SENDKEY`: Server酱发送密钥
   - `SMTP_HOST`: SMTP服务器地址
   - `SMTP_PORT`: SMTP端口
   - `SMTP_USER`: SMTP用户名
   - `SMTP_PASSWORD`: SMTP密码
   - `HOST`: VPS服务器地址
   - `USERNAME`: 服务器用户名
   - `SSH_KEY`: SSH私钥

### 2. 配置服务器
```bash
# 在VPS上执行
sudo apt update
sudo apt install -y git nodejs npm nginx
sudo npm install -g pm2

# 克隆代码
git clone https://github.com/your-username/weather-alert-system.git /opt/weather-alert-system
cd /opt/weather-alert-system

# 配置环境变量
cp .env.example .env
# 编辑.env文件

# 安装依赖
npm ci --production
npm run build

# 启动服务
pm2 start npm --name "weather-alert-system" -- start
pm2 startup
pm2 save
```

### 3. 配置Nginx
```bash
sudo cp nginx.conf /etc/nginx/sites-available/weather-alert-system
sudo ln -s /etc/nginx/sites-available/weather-alert-system /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 🖥️ VPS手动部署

### 1. 系统要求
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Node.js 18+
- 2GB+ RAM
- 10GB+ 存储空间

### 2. 一键部署
```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/your-username/weather-alert-system/main/deploy.sh
chmod +x deploy.sh

# 执行部署（替换your-domain.com为您的域名）
sudo ./deploy.sh your-domain.com
```

### 3. 手动部署步骤
```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装依赖
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx nodejs npm

# 3. 安装PM2
sudo npm install -g pm2

# 4. 克隆代码
git clone https://github.com/your-username/weather-alert-system.git /opt/weather-alert-system
cd /opt/weather-alert-system

# 5. 配置环境
cp .env.example .env
nano .env  # 编辑配置

# 6. 安装依赖
npm ci --production
npx prisma generate
npx prisma db push
npm run build

# 7. 配置Nginx
sudo cp nginx.conf /etc/nginx/sites-available/weather-alert-system
sudo sed -i 's/your-domain.com/your-domain.com/g' /etc/nginx/sites-available/weather-alert-system
sudo ln -s /etc/nginx/sites-available/weather-alert-system /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 8. 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 9. 启动服务
pm2 start npm --name "weather-alert-system" -- start
pm2 startup
pm2 save

# 10. 设置定时备份
crontab -e
# 添加: 0 2 * * * /opt/weather-alert-system/scripts/backup.sh
```

## 🐳 Docker部署

### 1. 使用Docker Compose
```bash
# 克隆代码
git clone https://github.com/your-username/weather-alert-system.git
cd weather-alert-system

# 配置环境变量
cp .env.example .env
nano .env

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 2. 单独使用Docker
```bash
# 构建镜像
docker build -t weather-alert-system .

# 运行容器
docker run -d \
  --name weather-alert-system \
  -p 3000:3000 \
  -v $(pwd)/dev.db:/app/dev.db \
  --env-file .env \
  weather-alert-system
```

### 3. Docker环境变量
```bash
# 创建docker-compose.override.yml
version: '3.8'
services:
  weather-alert-system:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./dev.db
      - NEXTAUTH_SECRET=your-secret-here
      - SERVERCHAN_SENDKEY=your-sendkey-here
```

## ☁️ 云平台部署

### 1. Vercel部署
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod

# 配置环境变量
vercel env add NEXTAUTH_SECRET
vercel env add SERVERCHAN_SENDKEY
```

### 2. Railway部署
1. 连接GitHub仓库
2. 配置环境变量
3. 自动部署

### 3. DigitalOcean App Platform
1. 创建新应用
2. 连接GitHub仓库
3. 配置构建命令：`npm run build`
4. 配置运行命令：`npm start`
5. 添加环境变量

## ⚙️ 环境配置

### 必需的环境变量
```bash
# 数据库
DATABASE_URL="file:./dev.db"

# Next.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"

# 通知配置
SERVERCHAN_SENDKEY="your-serverchan-sendkey"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### 可选的环境变量
```bash
# 应用配置
NODE_ENV="production"
PORT=3000
WEATHER_UPDATE_INTERVAL=600000
LOG_LEVEL="info"
```

## 📊 监控和维护

### 1. PM2监控
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs weather-alert-system

# 重启服务
pm2 restart weather-alert-system

# 监控面板
pm2 monit
```

### 2. 日志管理
```bash
# 查看应用日志
tail -f /opt/weather-alert-system/.pm2/logs/weather-alert-system-out.log

# 查看错误日志
tail -f /opt/weather-alert-system/.pm2/logs/weather-alert-system-error.log

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. 数据库维护
```bash
# 备份数据库
cp /opt/weather-alert-system/dev.db /opt/backups/dev.db_$(date +%Y%m%d)

# 查看数据库大小
du -h /opt/weather-alert-system/dev.db

# 清理旧数据（保留7天）
sqlite3 /opt/weather-alert-system/dev.db "DELETE FROM alerts WHERE write_time < datetime('now', '-7 days');"
```

### 4. SSL证书更新
```bash
# 自动更新（已设置cron）
sudo certbot renew --quiet

# 手动更新
sudo certbot renew
sudo systemctl reload nginx
```

### 5. 系统更新
```bash
# 更新代码
cd /opt/weather-alert-system
git pull origin main
npm ci --production
npm run build
pm2 restart weather-alert-system

# 更新系统包
sudo apt update && sudo apt upgrade -y
```

## 🔧 故障排除

### 常见问题

1. **端口被占用**
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

2. **数据库权限问题**
```bash
sudo chown www-data:www-data /opt/weather-alert-system/dev.db
sudo chmod 664 /opt/weather-alert-system/dev.db
```

3. **Nginx配置错误**
```bash
sudo nginx -t
sudo systemctl status nginx
```

4. **内存不足**
```bash
# 创建swap文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📞 支持

如果遇到问题，请：
1. 查看日志文件
2. 检查环境变量配置
3. 确认防火墙设置
4. 提交Issue到GitHub仓库

## 🔐 安全建议

1. 定期更新系统和依赖包
2. 使用强密码和SSH密钥
3. 配置防火墙（ufw）
4. 定期备份数据
5. 监控系统资源使用
6. 使用HTTPS（SSL/TLS）
7. 限制API访问频率