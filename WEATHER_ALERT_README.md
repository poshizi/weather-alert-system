# 气象预警系统

基于Next.js和TypeScript构建的现代化气象预警系统，支持实时数据获取、智能通知和可视化监控。

## 🌟 主要功能

### 1. 实时数据获取
- 自动从中国天气网获取最新气象预警信息
- 支持全国所有省份和城市的预警数据
- 每10分钟自动更新，确保数据时效性
- 批次管理，避免重复数据

### 2. 智能通知系统
- **Server酱微信推送**：实时推送预警信息到微信
- **邮件通知**：支持HTML格式的邮件预警
- **筛选条件**：可按地区、灾害类型、预警等级设置过滤
- **多配置支持**：支持创建多个通知配置满足不同需求

### 3. 可视化界面
- **响应式设计**：支持桌面端和移动端
- **实时刷新**：页面每60秒自动更新
- **交互式表格**：点击查看详细信息
- **筛选功能**：支持多维度数据筛选

### 4. 系统监控
- **更新日志**：记录每次数据更新的详细信息
- **通知状态**：监控通知发送状态
- **统计面板**：展示系统运行状态和数据统计
- **配置管理**：可视化配置通知参数

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd weather-alert-system
```

2. **安装依赖**
```bash
npm install
```

3. **初始化数据库**
```bash
npm run db:push
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
- 主页：http://localhost:3000
- 通知配置：http://localhost:3000/config
- 系统监控：http://localhost:3000/monitor

## 📱 使用指南

### 1. 获取预警数据
- 访问主页点击"立即更新"按钮
- 或等待系统自动更新（每10分钟）
- 查看最新的预警信息和统计数据

### 2. 配置通知

#### Server酱配置
1. 访问 https://sct.ftqq.com/ 注册账号
2. 获取SendKey
3. 在通知配置页面填入密钥
4. 设置筛选条件（可选）
5. 启用通知

#### 邮件配置
1. 在通知配置页面填入邮箱地址
2. 设置筛选条件
3. 启用通知

### 3. 设置筛选条件

- **地区筛选**：选择特定省份或城市，支持前缀匹配
- **灾害类型**：选择关注的灾害类型（暴雨、高温等）
- **预警等级**：选择关注的预警等级（红色、橙色等）

### 4. 监控系统
- 访问监控页面查看系统状态
- 查看更新日志和通知记录
- 管理通知配置

## 🔧 API接口

### 获取预警数据
```
GET /api/weather/alerts
```
支持参数：
- `type`: 灾害类型筛选
- `level`: 预警等级筛选  
- `region`: 地区代码筛选
- `level_type`: 预警级别筛选（provincial/city）

### 更新预警数据
```
POST /api/weather/update
```

### 通知配置管理
```
GET /api/notification/config    # 获取配置
POST /api/notification/config   # 创建配置
PUT /api/notification/config    # 更新配置
DELETE /api/notification/config # 删除配置
```

### 系统监控
```
GET /api/monitor
```

### 定时任务
```
POST /api/cron/update
```

## 📊 数据库结构

### WeatherAlert（预警信息）
- 地区、地区代码、发布时间
- 灾害类型、预警等级
- 详情链接、经纬度
- 批次ID、时间戳

### UpdateLog（更新日志）
- 批次ID、更新时间
- 记录数量、状态
- 错误信息

### NotificationConfig（通知配置）
- Server酱密钥、邮箱地址
- 筛选条件（地区、类型、等级）
- 启用状态

### NotificationLog（通知日志）
- 预警ID、消息内容
- 发送时间、状态

## 🛠️ 技术栈

- **前端框架**：Next.js 15 + TypeScript
- **UI组件**：shadcn/ui + Tailwind CSS
- **数据库**：Prisma + SQLite
- **状态管理**：React Hooks + Zustand
- **通知服务**：Server酱 API
- **部署**：支持Vercel、Docker等

## 📝 开发说明

### 项目结构
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── weather/       # 天气相关API
│   │   ├── notification/  # 通知相关API
│   │   ├── monitor/       # 监控API
│   │   └── cron/          # 定时任务API
│   ├── page.tsx          # 主页
│   ├── config/page.tsx   # 配置页面
│   └── monitor/page.tsx  # 监控页面
├── components/ui/         # UI组件库
├── lib/                  # 工具库
│   └── db.ts            # 数据库连接
└── hooks/               # 自定义Hooks
```

### 环境变量
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 数据库操作
```bash
npm run db:push    # 推送schema到数据库
npm run db:studio  # 打开Prisma Studio
```

## 🔔 部署建议

### 1. 定时任务配置
使用cron job或云函数定时调用更新API：
```bash
# 每10分钟更新一次
*/10 * * * * curl -X POST https://your-domain.com/api/cron/update
```

### 2. 环境配置
- 生产环境设置正确的BASE_URL
- 配置适当的数据库连接
- 设置日志记录

### 3. 监控告警
- 配置系统健康检查
- 设置错误通知
- 监控API响应时间

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 📄 许可证

MIT License

## 🆘 支持

如有问题或建议，请提交Issue或联系开发团队。

---

**注意**：本系统仅用于气象预警信息展示，不构成官方预警发布渠道。请以官方气象部门发布的信息为准。