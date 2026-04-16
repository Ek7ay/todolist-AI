const request = require('supertest');
const express = require('express');
const todoRoutes = require('../routes/todos');
const { initDatabase } = require('../database');

const app = express();
app.use(express.json());
app.use('/api/todos', todoRoutes);

describe('Todo API', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    // 清理测试数据
    const db = require('../database').getDatabase();
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM todos', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    db.close();
  });

  describe('GET /api/todos', () => {
    it('应该返回空的待办事项列表', async () => {
      const response = await request(app).get('/api/todos');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('应该返回包含待办事项的列表', async () => {
      // 先创建一个待办事项
      const todoData = { text: '测试任务', completed: false };
      await request(app)
        .post('/api/todos')
        .send(todoData);

      const response = await request(app).get('/api/todos');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].text).toBe('测试任务');
      expect(response.body[0].completed).toBe(false);
    });
  });

  describe('POST /api/todos', () => {
    it('应该创建新的待办事项', async () => {
      const todoData = { text: '新任务', completed: false };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData);

      expect(response.status).toBe(201);
      expect(response.body.text).toBe('新任务');
      expect(response.body.completed).toBe(false);
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('应该拒绝空的待办事项内容', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '', completed: false });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('待办事项内容不能为空');
    });
  });

  describe('GET /api/todos/:id', () => {
    it('应该返回指定ID的待办事项', async () => {
      // 先创建一个待办事项
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: '查找任务', completed: false });

      const todoId = createResponse.body.id;

      const response = await request(app).get(`/api/todos/${todoId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(todoId);
      expect(response.body.text).toBe('查找任务');
    });

    it('应该返回404当待办事项不存在', async () => {
      const response = await request(app).get('/api/todos/999');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('待办事项不存在');
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('应该更新待办事项', async () => {
      // 先创建一个待办事项
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: '原始任务', completed: false });

      const todoId = createResponse.body.id;

      const updateResponse = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ text: '更新后的任务', completed: true });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.text).toBe('更新后的任务');
      expect(updateResponse.body.completed).toBe(true);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('应该删除指定的待办事项', async () => {
      // 先创建一个待办事项
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: '待删除任务', completed: false });

      const todoId = createResponse.body.id;

      const deleteResponse = await request(app).delete(`/api/todos/${todoId}`);
      expect(deleteResponse.status).toBe(204);

      // 验证确实被删除
      const getResponse = await request(app).get(`/api/todos/${todoId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});