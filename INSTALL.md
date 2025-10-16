# 🌦️ 气象预警系统 - 安装说明

## 📋 目录

- [系统要求](#系统要求)
- [快速安装](#快速安装)
- [详细安装步骤](#详细安装步骤)
- [配置说明](#配置说明)
- [验证安装](#验证安装)
- [故障排除](#故障排除)
- [升级指南](#升级指南)

## 💻 系统要求

### 最低要求
- **操作系统**: Linux (Ubuntu 20.04+, CentOS 8+, Debian 11+)
- **CPU**: 1核心
- **内存**: 1GB RAM
- **存储**: 5GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **操作系统**: Ubuntu 22.04 LTS
- **CPU**: 2核心或更多
- **内存**: 2GB RAM 或更多
- **存储**: 20GB SSD
- **网络**: 100Mbps 带宽

### 软件依赖
- **Node.js**: 18.0+ 
- **npm**: 8.0+ 或 **yarn**: 1.22+
- **Git**: 2.0+
- **SQLite**: 3.x (内置)

### 可选依赖
- **Docker**: 20.10+ (容器化部署)
- **Nginx**: 1.18+ (反向代理)
- **PM2**: 5.0+ (进程管理)

## 🚀 快速安装

### 方式1: 一键脚本安装 (推荐)

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/your-username/weather-alert-system/main/install.sh | sudo bash

# 或者手动下载
wget https://raw.githubusercontent.com/your-username/weather-alert-system/main/install.sh
chmod +x install.sh
sudo ./install.sh
```

### 方式2: Docker快速安装

```bash
# 下载项目
git clone https://github.com/your-username/weather-alert-system.git
cd weather-alert-system

# 配置环境变量
cp .env.example .env
nano .env

# 启动服务
docker-compose up -d
```

### 方式3: 手动安装

```bash
# 1. 下载项目
git clone https://github.com/your-username/weather-alert-system.git
cd weather-alert-system

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.example .env
nano .env

# 4. 初始化数据库
npm run db:push

# 5. 启动服务
npm run dev
```

## 📖 详细安装步骤

### 步骤1: 环境准备

#### 1.1 更新系统
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### 1.2 安装Node.js
```bash
# 使用NodeSource仓库 (推荐)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 1.3 安装Git
```bash
# Ubuntu/Debian
sudo apt install git -y

# CentOS/RHEL
sudo yum install git -y

# 验证安装
git --version
```

#### 1.4 安装PM2 (进程管理)
```bash
sudo npm install -g pm2

# 验证安装
pm2 --version
```

### 步骤2: 下载项目

#### 2.1 克隆项目
```bash
# 克隆到推荐目录
cd /opt
sudo git clone https://github.com/your-username/weather-alert-system.git
sudo chown -R $USER:$USER /opt/weather-alert-system
cd /opt/weather-alert-system
```

#### 2.2 下载压缩包 (备选方式)
```bash
# 下载完整版
wget https://github.com/your-username/weather-alert-system/releases/download/v1.0.0/weather-alert-system-v1.0.0.tar.gz

# 解压
tar -xzf weather-alert-system-v1.0.0.tar.gz
cd weather-alert-system
```

### 步骤3: 安装依赖

#### 3.1 安装Node.js依赖
```bash
# 生产环境安装
npm ci --production

# 开发环境安装
npm install
```

#### 3.2 生成Prisma客户端
```bash
npx prisma generate
```

### 步骤4: 配置环境

#### 4.1 创建环境变量文件
```bash
# 复制模板文件
cp .env.example .env

# 编辑配置文件
nano .env
```

#### 4.2 配置必需变量
```bash
# 数据库配置
DATABASE_URL="file:./dev.db"

# Next.js配置
NEXTAUTH_SECRET="your-very-secure-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# 通知配置 (可选)
SERVERCHAN_SENDKEY="your-serverchan-sendkey"
```

#### 4.3 配置可选变量
```bash
# 邮件通知配置
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# 应用配置
NODE_ENV="production"
PORT=3000
WEATHER_UPDATE_INTERVAL=600000
LOG_LEVEL="info"
```

### 步骤5: 初始化数据库

#### 5.1 创建数据库
```bash
# 推送schema到数据库
npm run db:push

# 或者运行迁移 (如果有迁移文件)
npm run db:migrate
```

#### 5.2 验证数据库
```bash
# 检查数据库文件
ls -la dev.db

# 测试数据库连接
npx prisma db pull
```

### 步骤6: 构建应用

#### 6.1 构建生产版本
```bash
# 构建应用
npm run build

# 验证构建
ls -la .next
```

#### 6.2 测试应用
```bash
# 启动测试服务器
npm start

# 在另一个终端测试
curl http://localhost:3000/api/health
```

### 步骤7: 配置进程管理

#### 7.1 使用PM2启动
```bash
# 启动应用
pm2 start npm --name "weather-alert-system" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs weather-alert-system
```

#### 7.2 配置Systemd服务 (备选)
```bash
# 创建服务文件
sudo nano /etc/systemd/system/weather-alert-system.service
```

```ini
[Unit]
Description=Weather Alert System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/weather-alert-system
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable weather-alert-system
sudo systemctl start weather-alert-system

# 查看状态
sudo systemctl status weather-alert-system
```

### 步骤8: 配置Web服务器 (可选)

#### 8.1 安装Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx -y

# 启动并启用Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 8.2 配置Nginx反向代理
```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/weather-alert-system
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/weather-alert-system /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 步骤9: 配置SSL证书 (推荐)

#### 9.1 安装Certbot
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y
```

#### 9.2 获取SSL证书
```bash
# 自动获取并配置SSL
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

### 步骤10: 配置防火墙

#### 10.1 配置UFW (Ubuntu)
```bash
# 启用防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow ssh

# 允许HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 查看状态
sudo ufw status
```

#### 10.2 配置firewalld (CentOS)
```bash
# 启用防火墙
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许服务
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 重载配置
sudo firewall-cmd --reload
```

## ⚙️ 配置说明

### 环境变量详解

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_URL` | ✅ | - | 数据库连接字符串 |
| `NEXTAUTH_SECRET` | ✅ | - | Next.js密钥 (随机字符串) |
| `NEXTAUTH_URL` | ✅ | http://localhost:3000 | 应用访问URL |
| `SERVERCHAN_SENDKEY` | ❌ | - | Server酱发送密钥 |
| `SMTP_HOST` | ❌ | - | SMTP服务器地址 |
| `SMTP_PORT` | ❌ | 587 | SMTP端口 |
| `SMTP_USER` | ❌ | - | SMTP用户名 |
| `SMTP_PASSWORD` | ❌ | - | SMTP密码 |
| `NODE_ENV` | ❌ | development | 运行环境 |
| `PORT` | ❌ | 3000 | 应用端口 |
| `WEATHER_UPDATE_INTERVAL` | ❌ | 600000 | 数据更新间隔(毫秒) |

### 生成安全密钥

```bash
# 生成NEXTAUTH_SECRET
openssl rand -base64 32

# 或者使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Server酱配置

1. 访问 [Server酱官网](https://sct.ftqq.com/)
2. 注册账号并登录
3. 获取SendKey
4. 在`.env`文件中配置`SERVERCHAN_SENDKEY`

### 邮件配置示例

#### Gmail配置
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"  # 使用应用专用密码
```

#### QQ邮箱配置
```bash
SMTP_HOST="smtp.qq.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@qq.com"
SMTP_PASSWORD="your-authorization-code"
```

## ✅ 验证安装

### 1. 检查服务状态
```bash
# PM2状态
pm2 status

# Systemd状态
sudo systemctl status weather-alert-system

# 端口监听
sudo netstat -tlnp | grep :3000
```

### 2. 测试API接口
```bash
# 健康检查
curl http://localhost:3000/api/health

# 预警数据
curl http://localhost:3000/api/weather/alerts

# 数据更新
curl -X POST http://localhost:3000/api/weather/update
```

### 3. 访问Web界面
- 本地访问: http://localhost:3000
- 域名访问: http://your-domain.com
- HTTPS访问: https://your-domain.com

### 4. 检查日志
```bash
# PM2日志
pm2 logs weather-alert-system

# 应用日志
tail -f /opt/weather-alert-system/.pm2/logs/weather-alert-system-out.log

# 错误日志
tail -f /opt/weather-alert-system/.pm2/logs/weather-alert-system-error.log
```

## 🔧 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查看端口占用
sudo lsof -i :3000

# 杀死进程
sudo kill -9 PID

# 或更改端口
export PORT=3001
npm start
```

#### 2. 数据库权限问题
```bash
# 修改数据库文件权限
sudo chown www-data:www-data /opt/weather-alert-system/dev.db
sudo chmod 664 /opt/weather-alert-system/dev.db
```

#### 3. 依赖安装失败
```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 4. Prisma生成失败
```bash
# 重新生成客户端
npx prisma generate

# 重置数据库
npx prisma db push --force-reset
```

#### 5. 内存不足
```bash
# 创建swap文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 日志分析

#### 应用启动失败
```bash
# 查看详细错误
pm2 logs weather-alert-system --err

# 检查配置
cat .env
```

#### 数据更新失败
```bash
# 检查网络连接
curl -I https://product.weather.com.cn

# 手动测试API
curl -X POST http://localhost:3000/api/weather/update
```

#### 通知发送失败
```bash
# 测试Server酱
curl -X POST https://sctapi.ftqq.com/sendkey=YOUR_SENDKEY

# 检查SMTP配置
telnet smtp.gmail.com 587
```

## 🔄 升级指南

### 自动升级
```bash
# 拉取最新代码
cd /opt/weather-alert-system
git pull origin main

# 安装新依赖
npm ci --production

# 重新构建
npm run build

# 重启服务
pm2 restart weather-alert-system
```

### 手动升级
```bash
# 备份数据
cp dev.db dev.db.backup

# 下载新版本
wget https://github.com/your-username/weather-alert-system/releases/latest/download/weather-alert-system-v1.0.0.tar.gz

# 解压并覆盖
tar -xzf weather-alert-system-v1.0.0.tar.gz
cp -r weather-alert-system/* /opt/weather-alert-system/

# 重新安装和启动
cd /opt/weather-alert-system
npm ci --production
npm run build
pm2 restart weather-alert-system
```

### 数据库迁移
```bash
# 运行迁移
npm run db:migrate

# 检查迁移状态
npx prisma migrate status
```

## 📞 获取帮助

### 文档资源
- [项目README](README.md)
- [部署指南](DEPLOYMENT.md)
- [API文档](docs/API.md)

### 社区支持
- [GitHub Issues](https://github.com/your-username/weather-alert-system/issues)
- [讨论区](https://github.com/your-username/weather-alert-system/discussions)

### 技术支持
- 📧 邮箱: support@example.com
- 💬 QQ群: 123456789
- 📱 微信群: 扫描二维码

---

**安装完成后，请访问 http://your-domain.com 查看您的气象预警系统！** 🎉

**版本**: v1.0.0  
**更新时间**: 2025-10-16  
**兼容性**: Node.js 18+, Ubuntu 20.04+