const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const todoRoutes = require('./routes/todos');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 60001;

// 中间件
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://10.112.71.7:5173'], // 允许的源
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/todos', todoRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '路由未找到' });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`局域网访问: http://你的IP地址:${PORT}`);
      console.log(`API文档: http://localhost:${PORT}/api/todos`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();