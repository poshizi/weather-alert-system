# EHS 法规合规评价系统 - 快速部署指南

## 🚀 快速开始

### 1. 环境准备
```bash
# Node.js 18+
node --version

# 克隆项目
git clone <your-repo>
cd ehs-system

# 安装依赖
npm install
```

### 2. 数据库初始化
```bash
# 推送数据库schema
npm run db:push
```

### 3. 环境变量配置
创建 `.env` 文件：
```bash
DATABASE_URL="file:./dev.db"
```

### 4. 启动应用
```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

访问 http://localhost:3000

## 🌐 部署方式

### Vercel 部署（推荐）
1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量 `DATABASE_URL`
4. 自动部署完成

### Docker 部署
```bash
# 构建镜像
docker build -t ehs-system .

# 运行容器
docker run -p 3000:3000 ehs-system
```

### 传统服务器部署
```bash
# 安装 PM2
npm install -g pm2

# 构建项目
npm run build

# 启动应用
pm2 start npm --name "ehs-system" -- start
```

## 📋 系统功能

### ✅ 已实现功能
- ✅ 网络文件获取（PDF、Word）
- ✅ OpenAI 配置管理
- ✅ 文档解析和条款提取
- ✅ AI 驱动的合规评价
- ✅ 详细的评价结果展示
- ✅ 响应式界面设计

### 🔧 核心特性
- 🌐 **网络文件获取**: 支持从URL直接获取文档，无需本地上传
- 🤖 **AI 智能分析**: 基于大模型的法规适用性判断和合规评分
- 📊 **可视化结果**: 直观的图表和详细的匹配分析
- 🔒 **安全可靠**: 无文件上传风险，支持多种部署方式

## 📝 使用流程

1. **配置 AI 模型**: 在系统设置中配置 OpenAI API
2. **获取文档**: 通过网络地址获取法规和制度文件
3. **创建评价**: 选择文档并创建评价任务
4. **查看结果**: 查看详细的合规分析报告

## 🛠️ 故障排除

### 构建问题
```bash
# 清理缓存
rm -rf .next node_modules
npm install
npm run build
```

### 数据库问题
```bash
# 重新生成客户端
npx prisma generate
npm run db:push
```

### API 问题
- 检查 OpenAI 配置是否正确
- 确认网络文件 URL 可访问
- 查看控制台错误信息

## 📞 技术支持

- 📧 Email: support@ehs-system.com
- 📖 文档: [完整部署说明](./DEPLOYMENT.md)
- 🐛 问题反馈: GitHub Issues

---

**注意**: 本系统已优化为生产环境部署，移除了本地文件上传功能，采用网络文件获取方式，提高了部署的安全性和便利性。