# TodoList AI 项目

一个完整的待办事项应用，包含前端(Vue 3)和后端(Express)。

## 项目结构
- `todo-app/` - 前端应用 (Vue 3 + Element Plus + TypeScript)
- `todo-backend/` - 后端API (Express + MySQL)

## 快速开始

### 后端启动
```bash
cd todo-backend
npm install
npm run dev
```

后端将运行在 `http://localhost:60001`

### 前端启动
```bash
cd todo-app
npm install
npm run dev
```

前端将运行在 `http://localhost:5173`

## 功能特性

### 前端功能
- ✅ 添加待办事项
- ✅ 删除单个/批量删除待办事项  
- ✅ 标记完成单个/批量完成待办事项
- ✅ 响应式设计，支持移动端
- ✅ 超过5条数据自动显示滚动条
- ✅ API连接状态检测
- ✅ 优雅的加载状态和错误提示

### 后端功能
- ✅ RESTful API 设计
- ✅ MySQL 数据库集成
- ✅ CORS 跨域支持
- ✅ 安全中间件 (Helmet)
- ✅ 请求日志 (Morgan)
- ✅ 健康检查接口

## 技术栈

### 前端
- Vue 3
- TypeScript
- Element Plus UI 组件库
- Vite 构建工具
- Pinia 状态管理
- Vue Router 路由管理

### 后端
- Node.js
- Express 框架
- MySQL 2 数据库驱动
- CORS 跨域中间件
- Helmet 安全中间件
- Morgan 日志中间件

## API 接口

- `GET /api/todos` - 获取所有待办事项
- `POST /api/todos` - 创建新待办事项
- `PUT /api/todos/:id` - 更新待办事项
- `DELETE /api/todos/:id` - 删除待办事项
- `DELETE /api/todos/completed` - 删除所有已完成的待办事项
- `GET /health` - 健康检查

## 数据库结构

### todos 表
```sql
CREATE TABLE todolist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  text VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 项目截图

[待添加项目截图]

## 许可证

MIT License
