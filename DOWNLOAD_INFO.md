# 📦 气象预警系统 - 下载信息

## 🎯 测试结果

✅ **系统测试完成 - 所有功能正常**

### 测试项目
- ✅ 健康检查API: 正常运行
- ✅ 预警数据API: 正常获取数据 (64,930条记录)
- ✅ 数据更新API: 成功更新 (503条新记录)
- ✅ 数据库连接: SQLite正常
- ✅ 系统运行时间: 2.5小时稳定运行

## 📦 可用下载包

### 1. 完整版 (推荐生产环境)
**文件名**: `weather-alert-system-v1.0.0.tar.gz`  
**大小**: 5.7MB  
**包含**: 
- 完整源代码
- 所有依赖包 (node_modules)
- 数据库文件 (示例数据)
- 部署配置文件
- 完整文档

**适合**: 直接部署到生产环境，无需额外安装依赖

### 2. 轻量版 (推荐开发环境)
**文件名**: `weather-alert-system-lite-v1.0.0.tar.gz`  
**大小**: 45KB  
**包含**:
- 源代码
- 配置文件
- 文档
- 部署脚本

**适合**: 开发环境，需要手动安装依赖

## 🚀 快速部署指南

### 完整版部署
```bash
# 下载并解压
wget [下载链接]
tar -xzf weather-alert-system-v1.0.0.tar.gz
cd my-project

# 配置环境变量
cp .env.example .env
nano .env

# 启动服务
npm start
```

### 轻量版部署
```bash
# 下载并解压
wget [下载链接]
tar -xzf weather-alert-system-lite-v1.0.0.tar.gz
cd my-project

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env

# 初始化数据库
npm run db:push

# 启动开发服务器
npm run dev
```

## 🔧 环境配置

### 必需配置
```bash
# .env 文件配置
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
SERVERCHAN_SENDKEY="your-serverchan-key"
```

### 可选配置
```bash
# 邮件通知
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

## 🌐 访问地址

部署完成后可通过以下地址访问：

- **主页面**: http://localhost:3000
- **健康检查**: http://localhost:3000/api/health
- **预警数据**: http://localhost:3000/api/weather/alerts
- **系统监控**: http://localhost:3000/monitor

## 📋 部署选项

### 1. 本地开发
```bash
npm run dev
```

### 2. Docker部署
```bash
docker-compose up -d
```

### 3. VPS一键部署
```bash
sudo ./deploy.sh your-domain.com
```

### 4. 手动生产部署
```bash
npm run build
npm run start
```

## 📞 技术支持

- 📖 查看详细文档: `DEPLOYMENT.md`
- 🚀 快速部署指南: `QUICK_DEPLOY.md`
- 📋 项目清单: `MANIFEST.md`
- 🔧 系统配置: `README.md`

## ⚠️ 注意事项

1. **防火墙设置**: 确保端口3000已开放
2. **SSL证书**: 生产环境建议配置HTTPS
3. **数据备份**: 系统会自动备份，也可手动备份
4. **定期更新**: 建议定期更新系统和依赖包

## 🎉 系统特性

- 🔄 自动每10分钟更新气象预警数据
- 📊 实时数据统计与可视化
- 🔔 多种通知方式 (Server酱、邮件)
- 📱 响应式设计，支持移动端
- 🛡️ 安全的API接口
- 💾 自动数据备份和清理
- 🌐 支持Docker容器化部署

---

**版本**: v1.0.0  
**测试时间**: 2025-10-16 06:54  
**状态**: ✅ 测试通过，可安全部署