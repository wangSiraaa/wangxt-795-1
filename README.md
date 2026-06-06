# 高校科研经费报销预审系统

全栈科研经费报销预审管理系统，覆盖课题预算、报销申请、票据附件、科目余额、领导确认和结题冻结全流程。

## 功能特性

### 核心模块
- **课题看板**：课题信息管理、预算科目配置、结题冻结
- **报销申请**：报销单创建、明细录入、票据上传
- **财务预审**：票据审核、预算合规性检查、预审意见
- **领导确认**：超预算科目确认流程
- **状态追踪**：完整的状态历史记录

### 业务规则（5条核心规则）
1. **超预算需领导确认**：申请金额超过预算余额时，需项目负责人审批确认
2. **票据缺失不能送审**：必须上传票据附件后才能提交送审
3. **结题后只读**：项目结题后只能查看历史数据，不能新增报销
4. **发票号唯一**：同一张发票号不能重复报销
5. **退回需修改说明**：预审退回后再次提交必须填写修改说明

## 技术栈

### 后端
- Node.js + Express
- SQLite3 数据库
- Multer 文件上传

### 前端
- React 18 + TypeScript
- Vite 构建工具
- Ant Design 组件库
- React Router 路由
- Axios HTTP 客户端

### 容器化
- Docker + Docker Compose

## 快速开始

### 方式一：本地启动

```bash
# 启动脚本（推荐）
chmod +x start.sh
./start.sh

# 或手动执行
# 1. 安装后端依赖
cd backend && npm install

# 2. 安装前端依赖
cd ../frontend && npm install

# 3. 初始化数据库
cd ../backend && node src/scripts/initDb.js

# 4. 启动后端（端口3001）
node src/server.js &

# 5. 启动前端（端口3000）
cd ../frontend && npm run dev
```

### 方式二：Docker 启动

```bash
# Docker 启动脚本
chmod +x start-docker.sh
./start-docker.sh

# 或使用 docker-compose
docker-compose up -d --build
```

## 访问地址

- **前端页面**：http://localhost:3000
- **后端 API**：http://localhost:4000/api
- **健康检查**：http://localhost:4000/api/health

## 验收测试

运行验收测试脚本验证核心业务规则：

```bash
# 本地运行
BASE_URL=http://localhost:4000 node scripts/acceptance-test.js

# Docker 中运行
COMPOSE_PROJECT_NAME=wangxt795 docker-compose run --rm test-runner

# 使用隔离端口运行完整容器验收
COMPOSE_PROJECT_NAME=wangxt795 BACKEND_HOST_PORT=17950 FRONTEND_HOST_PORT=17951 docker-compose up -d --build
COMPOSE_PROJECT_NAME=wangxt795 docker-compose run --rm test-runner
```

### 测试覆盖场景
1. ✅ 创建测试课题和预算科目
2. ✅ 创建报销单并添加明细
3. ✅ 验证：缺少票据时提交送审被拒绝
4. ✅ 上传第一张票据成功
5. ✅ 验证：使用重复发票号被拒绝
6. ✅ 有票据后成功提交送审
7. ✅ 验证：课题结题后不能新增报销

## 项目结构

```
.
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # API 路由
│   │   ├── rules/          # 业务规则
│   │   ├── scripts/        # 初始化脚本
│   │   └── server.js       # 服务入口
│   ├── Dockerfile
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   ├── types/          # TypeScript 类型
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── scripts/                # 测试脚本
│   └── acceptance-test.js
├── docker-compose.yml
├── start.sh               # 本地启动脚本
├── start-docker.sh        # Docker 启动脚本
└── README.md
```

## API 接口

### 课题管理
- `GET /api/projects` - 获取所有课题
- `GET /api/projects/:id` - 获取课题详情
- `POST /api/projects` - 创建课题
- `POST /api/projects/:id/close` - 结题
- `GET /api/projects/:id/budgets` - 获取预算科目
- `POST /api/projects/:id/budgets` - 保存预算科目

### 报销管理
- `GET /api/reimbursements` - 获取所有报销单
- `GET /api/reimbursements/:id` - 获取报销单详情
- `POST /api/reimbursements` - 创建报销单
- `PUT /api/reimbursements/:id` - 更新报销单
- `POST /api/reimbursements/:id/submit` - 提交送审
- `POST /api/reimbursements/:id/pre-review` - 财务预审
- `POST /api/reimbursements/:id/confirm` - 超预算确认

### 票据管理
- `GET /api/invoices/:reimbursementId` - 获取票据列表
- `POST /api/invoices/:reimbursementId` - 上传票据
- `DELETE /api/invoices/:id` - 删除票据

## 数据库表结构

- `projects` - 课题表
- `budget_subjects` - 预算科目表
- `reimbursements` - 报销单表
- `reimbursement_items` - 报销明细表
- `invoices` - 票据表
- `pre_reviews` - 预审记录表
- `confirmations` - 确认记录表
- `status_history` - 状态历史表

## 停止服务

```bash
# 本地启动的进程手动终止
# 或使用 Ctrl+C

# Docker 停止
docker-compose down
```
