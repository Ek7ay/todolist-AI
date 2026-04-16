# Todo Backend API

这是一个基于 Node.js + Express + SQLite 的待办事项后端 API。

## 功能特性

- ✅ 获取所有待办事项
- ✅ 创建新的待办事项
- ✅ 获取单个待办事项
- ✅ 更新待办事项
- ✅ 删除单个待办事项
- ✅ 删除所有已完成的待办事项
- ✅ 数据持久化存储
- ✅ 完整的错误处理
- ✅ CORS 支持
- ✅ 安全中间件

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite
- **中间件**: CORS, Helmet, Morgan
- **测试**: Jest + Supertest

## API 接口文档

### 获取所有待办事项

```http
GET /api/todos
```

**响应示例:**
```json
[
  {
    "id": 1,
    "text": "学习 Node.js",
    "completed": false,
    "createdAt": "2024-04-15T10:30:00.000Z"
  }
]
```

### 创建新的待办事项

```http
POST /api/todos
Content-Type: application/json

{
  "text": "新的待办事项",
  "completed": false
}
```

**响应示例:**
```json
{
  "id": 2,
  "text": "新的待办事项",
  "completed": false,
  "createdAt": "2024-04-15T10:35:00.000Z"
}
```

### 获取单个待办事项

```http
GET /api/todos/1
```

### 更新待办事项

```http
PUT /api/todos/1
Content-Type: application/json

{
  "text": "更新后的内容",
  "completed": true
}
```

### 删除单个待办事项

```http
DELETE /api/todos/1
```

### 删除所有已完成的待办事项

```http
DELETE /api/todos
```

## 安装和运行

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器（使用 nodemon）
npm run dev
```

### 生产环境

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

### 运行测试

```bash
# 运行所有测试
npm test
```

## 项目结构

```
todo-backend/
├── src/
│   ├── controllers/     # 控制器层
│   │   └── todoController.js
│   ├── routes/          # 路由层
│   │   └── todos.js
│   ├── database.js      # 数据库配置
│   ├── index.js         # 应用入口
│   └── __tests__/       # 测试文件
│       └── todo.test.js
├── data/                # SQLite 数据库文件
├── package.json         # 项目配置
└── README.md           # 项目文档
```

## 环境变量

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| PORT | 3000 | 服务器端口号 |

## 错误处理

API 使用标准的 HTTP 状态码：

- `200` - 成功
- `201` - 创建成功
- `204` - 删除成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

错误响应格式：
```json
{
  "error": "错误描述信息"
}
```

## 前端集成

这个后端 API 可以与 `h:\todo-app` 中的 Vue.js 前端项目配合使用。前端可以通过以下方式调用 API：

```javascript
const API_BASE_URL = 'http://localhost:3000/api';

// 获取所有待办事项
const todos = await fetch(`${API_BASE_URL}/todos`).then(res => res.json());

// 创建新的待办事项
const newTodo = await fetch(`${API_BASE_URL}/todos`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: '新任务', completed: false })
}).then(res => res.json());
```