# 🚀 气象预警系统 - 快速安装指南

## ⚡ 5分钟快速部署

### 方式1: 一键安装脚本 (推荐)

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/your-username/weather-alert-system/main/install.sh | sudo bash

# 或者带Nginx和SSL的完整安装
curl -fsSL https://raw.githubusercontent.com/your-username/weather-alert-system/main/install.sh | sudo bash -s -- --nginx --domain your-domain.com --ssl
```

### 方式2: Docker快速安装

```bash
# 1. 克隆项目
git clone https://github.com/your-username/weather-alert-system.git
cd weather-alert-system

# 2. 配置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
open http://localhost:3000
```

### 方式3: 手动快速安装

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

# 5. 启动开发服务器
npm run dev
```

## 🔧 最简配置

### 必需配置 (.env文件)

```bash
# 数据库
DATABASE_URL="file:./dev.db"

# 安全密钥 (生成方法: openssl rand -base64 32)
NEXTAUTH_SECRET="your-very-secure-secret-key-here"

# 应用URL
NEXTAUTH_URL="http://localhost:3000"
```

### 可选配置 (通知功能)

```bash
# Server酱通知 (获取地址: https://sct.ftqq.com/)
SERVERCHAN_SENDKEY="your-serverchan-sendkey"

# 邮件通知
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

## 🌐 访问地址

安装完成后访问：

- **本地**: http://localhost:3000
- **服务器**: http://your-server-ip:3000
- **域名**: http://your-domain.com

## 📱 验证安装

### 检查服务状态
```bash
# PM2状态
pm2 status

# 健康检查
curl http://localhost:3000/api/health
```

### 测试功能
1. 访问主页面查看预警数据
2. 点击"立即更新"测试数据获取
3. 配置通知功能测试推送

## 🔥 常见问题快速解决

### 端口被占用
```bash
# 查看占用进程
lsof -i :3000

# 杀死进程
kill -9 PID

# 或更改端口
export PORT=3001
npm start
```

### 权限问题
```bash
# 修改文件权限
sudo chown -R $USER:$USER .
chmod +x install.sh
```

### 依赖安装失败
```bash
# 清理缓存重试
npm cache clean --force
rm -rf node_modules
npm install
```

### 数据库问题
```bash
# 重新初始化数据库
npx prisma generate
npx prisma db push
```

## 📋 系统要求

- **操作系统**: Linux/macOS/Windows
- **Node.js**: 18+ 
- **内存**: 1GB+
- **存储**: 1GB+

## 🎯 下一步

1. **配置通知** - 设置Server酱或邮件通知
2. **域名绑定** - 配置域名和SSL证书  
3. **定时备份** - 设置自动数据备份
4. **监控设置** - 配置系统监控

## 📞 获取帮助

- 📖 [完整安装文档](INSTALL.md)
- 🚀 [部署指南](DEPLOYMENT.md)
- 🐛 [报告问题](https://github.com/your-username/weather-alert-system/issues)

---

**安装完成后，您将拥有一个功能完整的气象预警系统！** 🎉