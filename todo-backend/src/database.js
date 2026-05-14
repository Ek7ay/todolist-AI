const mysql = require('mysql2/promise');

// MySQL 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  port: 3306,
  database: 'todo_app'
};

// 创建数据库连接池
let pool;

// 获取数据库连接池
function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// 初始化数据库和表
async function initDatabase() {
  let connection;
  try {
    // 首先创建数据库（如果不存在）
    const rootPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    await rootPool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`数据库 ${dbConfig.database} 已创建或已存在`);
    await rootPool.end();

    // 创建连接池
    pool = mysql.createPool(dbConfig);

    // 创建 todolist 表
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS todolist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    connection = await pool.getConnection();
    await connection.execute(createTableQuery);
    console.log('数据表 todolist 创建成功');

  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 执行查询
async function query(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// 执行单个查询（返回单行）
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}

module.exports = {
  getPool,
  initDatabase,
  query,
  queryOne
};