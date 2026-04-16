const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');

// GET /api/todos - 获取所有待办事项
router.get('/', todoController.getAllTodos);

// GET /api/todos/:id - 获取单个待办事项
router.get('/:id', todoController.getTodoById);

// POST /api/todos - 创建新的待办事项
router.post('/', todoController.createTodo);

// PUT /api/todos/:id - 更新待办事项
router.put('/:id', todoController.updateTodo);

// DELETE /api/todos/:id - 删除单个待办事项
router.delete('/:id', todoController.deleteTodo);

// DELETE /api/todos - 删除所有已完成的待办事项
router.delete('/', todoController.deleteCompletedTodos);

module.exports = router;