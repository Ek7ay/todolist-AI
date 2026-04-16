# 前后端联调指南

本文档说明如何将前端 Vue.js 应用与后端 Node.js API 进行集成。

## 🌐 服务地址

- **前端应用**: http://localhost:5178
- **后端API**: http://localhost:3000
- **API基础路径**: http://localhost:3000/api

## 🔧 启动顺序

### 1. 启动后端服务

```bash
# 进入后端目录
cd h:\todo-backend

# 安装依赖（首次运行）
npm install

# 启动后端服务器
npm start
```

后端启动成功后，你会看到：
```
服务器运行在 http://localhost:3000
API文档: http://localhost:3000/api/todos
健康检查: http://localhost:3000/health
```

### 2. 启动前端应用

```bash
# 进入前端目录
cd h:\todo-app

# 启动前端开发服务器
npm run dev
```

前端启动成功后，你会看到：
```
VITE v8.0.8  ready in xxx ms

  ➜  Local:   http://localhost:5178/
```

## 📡 API 接口说明

### 获取所有待办事项
```http
GET http://localhost:3000/api/todos
```

### 创建新的待办事项
```http
POST http://localhost:3000/api/todos
Content-Type: application/json

{
  "text": "新的待办事项",
  "completed": false
}
```

### 更新待办事项
```http
PUT http://localhost:3000/api/todos/{id}
Content-Type: application/json

{
  "text": "更新后的内容",
  "completed": true
}
```

### 删除待办事项
```http
DELETE http://localhost:3000/api/todos/{id}
```

### 删除所有已完成的待办事项
```http
DELETE http://localhost:3000/api/todos
```

## 🔄 前端集成说明

### 已实现的功能

1. **✅ 自动连接检测**
   - 组件加载时自动检测后端服务是否可用
   - 如果后端未连接，会显示警告提示

2. **✅ 实时数据同步**
   - 所有操作都会实时同步到后端数据库
   - 页面刷新后数据不会丢失

3. **✅ 加载状态提示**
   - 所有API操作都有加载状态指示
   - 防止用户重复操作

4. **✅ 错误处理**
   - 网络错误会显示友好的错误提示
   - API调用失败会有相应的错误反馈

### 前端组件修改说明

#### API 服务层 (`src/services/api.ts`)
- 封装了所有与后端通信的 API 函数
- 包含错误处理和类型定义
- 提供健康检查功能

#### TodoList 组件更新
- 添加了 `apiConnected` 状态检测
- 添加了 `loading` 状态管理
- 所有操作都通过 API 与后端通信
- 添加了错误提示和成功反馈

## 🐛 常见问题排查

### 问题1: 前端显示"后端服务未连接"

**可能原因:**
- 后端服务未启动
- 后端服务启动在不同的端口
- 网络连接问题

**解决方案:**
1. 确保后端服务已启动：`cd h:\todo-backend && npm start`
2. 检查后端是否运行在 3000 端口
3. 检查浏览器控制台是否有 CORS 错误

### 问题2: 跨域请求失败 (CORS)

**错误信息:**
```
Access to fetch at 'http://localhost:3000/api/todos' from origin 'http://localhost:5178' has been blocked by CORS policy
```

**解决方案:**
- 后端已经配置了 CORS 支持，确保后端服务正常运行
- 如果问题依旧，检查 `h:\todo-backend\src\index.js` 中的 CORS 配置

### 问题3: 数据库文件权限问题

**错误信息:**
```
sqlite3.OperationalError: unable to open database file
```

**解决方案:**
1. 确保 `h:\todo-backend\data` 目录存在且有写权限
2. 手动创建目录：`mkdir h:\todo-backend\data`

## 🧪 测试验证

### 手动测试步骤

1. **启动后端服务**
   ```bash
   cd h:\todo-backend
   npm start
   ```

2. **启动前端应用**
   ```bash
   cd h:\todo-app
   npm run dev
   ```

3. **打开浏览器访问前端**
   - 访问 http://localhost:5178
   - 应该能看到 Todo 应用界面

4. **测试功能**
   - ✅ 添加新的待办事项
   - ✅ 删除待办事项
   - ✅ 批量选择并删除
   - ✅ 批量选择并完成
   - ✅ 刷新页面后数据保持

### API 接口测试

使用 curl 或 Postman 测试 API 接口：

```bash
# 健康检查
curl http://localhost:3000/health

# 获取所有待办事项
curl http://localhost:3000/api/todos

# 创建新的待办事项
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"text":"测试任务","completed":false}'
```

## 🚀 生产环境部署建议

### 后端部署
1. 使用环境变量配置端口和数据库路径
2. 添加 JWT 认证
3. 配置 HTTPS
4. 使用 PM2 或 Docker 进行进程管理

### 前端部署
1. 修改 `src/services/api.ts` 中的 API_BASE_URL
2. 使用 `npm run build` 构建生产版本
3. 配置 Nginx 或 Apache 进行静态文件服务

## 📊 项目状态

- ✅ 后端 API 开发完成
- ✅ 前端集成完成
- ✅ 数据库设计完成
- ✅ 错误处理完善
- ✅ 加载状态优化
- ✅ 用户界面友好

前后端联调已完成，可以正常进行数据的增删改查操作！