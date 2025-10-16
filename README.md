# 🌦️ 气象预警系统

一个基于Next.js的实时气象预警监控系统，支持多种通知方式和数据可视化。

## ✨ 功能特性

- 🌡️ **实时预警数据** - 每10分钟自动获取中国气象局预警信息
- 📊 **数据可视化** - 直观的图表和统计展示
- 🔔 **多种通知方式** - 支持Server酱、邮件等多种通知
- 🎯 **智能筛选** - 按地区、类型、等级筛选预警
- 📱 **响应式设计** - 完美适配移动端和桌面端
- 🔄 **自动更新** - 后台定时任务自动更新数据
- 💾 **数据备份** - 自动备份重要数据

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- SQLite (内置)

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/weather-alert-system.git
cd weather-alert-system

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
npm run db:push

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用。

## 📦 部署

### 🐳 Docker部署 (推荐)

```bash
# 使用Docker Compose
docker-compose up -d

# 或单独构建
docker build -t weather-alert-system .
docker run -d -p 3000:3000 --env-file .env weather-alert-system
```

### 🖥️ VPS部署

```bash
# 一键部署
wget https://raw.githubusercontent.com/your-username/weather-alert-system/main/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh your-domain.com
```

### ☁️ 云平台部署

支持部署到以下平台：
- Vercel
- Railway
- DigitalOcean App Platform
- Netlify

详细部署说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## ⚙️ 配置

### 环境变量

```bash
# 必需配置
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
SERVERCHAN_SENDKEY="your-serverchan-sendkey"

# 可选配置
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### Server酱配置

1. 访问 [Server酱官网](https://sct.ftqq.com/)
2. 注册并获取SendKey
3. 在环境变量中配置 `SERVERCHAN_SENDKEY`

### 邮件通知配置

1. 配置SMTP服务器信息
2. 设置发件人邮箱和密码
3. 启用邮件通知功能

## 📊 API文档

### 获取预警数据

```http
GET /api/weather/alerts
```

参数：
- `type`: 灾害类型筛选
- `level`: 预警等级筛选
- `region`: 地区筛选
- `level_type`: 预警级别筛选 (provincial/city)

### 手动更新数据

```http
POST /api/weather/update
```

### 健康检查

```http
GET /api/health
```

## 🎨 界面预览

### 主页面
- 实时预警数据展示
- 统计图表
- 快速筛选功能

### 预警详情
- 详细预警信息
- 历史数据对比
- 地理位置展示

### 通知配置
- 多种通知方式设置
- 筛选条件配置
- 实时测试功能

## 🔧 开发

### 项目结构

```
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React组件
│   ├── lib/             # 工具库
│   └── types/           # TypeScript类型定义
├── prisma/              # 数据库schema
├── public/              # 静态资源
├── scripts/             # 部署脚本
└── docker-compose.yml   # Docker配置
```

### 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run db:push      # 同步数据库
npm run backup       # 备份数据
npm run deploy       # 部署到服务器
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [中国气象局](http://www.cma.gov.cn/) - 提供预警数据
- [Next.js](https://nextjs.org/) - 前端框架
- [Prisma](https://www.prisma.io/) - 数据库ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库

## 📞 支持

如果您觉得这个项目有用，请给个⭐️！

遇到问题？请：
1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 部署指南
2. 提交 [Issue](https://github.com/your-username/weather-alert-system/issues)
3. 联系开发者

---

⚡ **实时监控，及时预警，守护安全**