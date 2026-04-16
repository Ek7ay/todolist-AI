const { query, queryOne } = require('../database');

// 获取所有待办事项
exports.getAllTodos = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM todolist ORDER BY created_at DESC');

    const todos = rows.map(row => ({
      id: row.id,
      text: row.text,
      completed: Boolean(row.completed),
      createdAt: row.created_at
    }));

    res.json(todos);
  } catch (err) {
    console.error('获取待办事项失败:', err);
    res.status(500).json({ error: '获取待办事项失败' });
  }
};

// 获取单个待办事项
exports.getTodoById = async (req, res) => {
  try {
    const todoId = req.params.id;
    const row = await queryOne('SELECT * FROM todolist WHERE id = ?', [todoId]);

    if (!row) {
      return res.status(404).json({ error: '待办事项不存在' });
    }

    const todo = {
      id: row.id,
      text: row.text,
      completed: Boolean(row.completed),
      createdAt: row.created_at
    };

    res.json(todo);
  } catch (err) {
    console.error('获取待办事项失败:', err);
    res.status(500).json({ error: '获取待办事项失败' });
  }
};

// 创建新的待办事项
exports.createTodo = async (req, res) => {
  try {
    const { text, completed = false } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: '待办事项内容不能为空' });
    }

    const result = await query(
      'INSERT INTO todolist (text, completed) VALUES (?, ?)',
      [text.trim(), completed ? 1 : 0]
    );

    const newTodo = {
      id: result.insertId,
      text: text.trim(),
      completed: Boolean(completed),
      createdAt: new Date().toISOString()
    };

    res.status(201).json(newTodo);
  } catch (err) {
    console.error('创建待办事项失败:', err);
    res.status(500).json({ error: '创建待办事项失败' });
  }
};

// 更新待办事项
exports.updateTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const { text, completed } = req.body;

    // 验证输入
    if (text !== undefined && (typeof text !== 'string' || text.trim() === '')) {
      return res.status(400).json({ error: '待办事项内容不能为空' });
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ error: '完成状态必须是布尔值' });
    }

    // 构建更新查询
    const updates = [];
    const values = [];

    if (text !== undefined) {
      updates.push('text = ?');
      values.push(text.trim());
    }

    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供更新内容' });
    }

    values.push(todoId);
    const updateQuery = `UPDATE todolist SET ${updates.join(', ')} WHERE id = ?`;

    const result = await query(updateQuery, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '待办事项不存在' });
    }

    // 获取更新后的数据
    const updatedRow = await queryOne('SELECT * FROM todolist WHERE id = ?', [todoId]);
    const updatedTodo = {
      id: updatedRow.id,
      text: updatedRow.text,
      completed: Boolean(updatedRow.completed),
      createdAt: updatedRow.created_at
    };

    res.json(updatedTodo);
  } catch (err) {
    console.error('更新待办事项失败:', err);
    res.status(500).json({ error: '更新待办事项失败' });
  }
};

// 删除单个待办事项
exports.deleteTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const result = await query('DELETE FROM todolist WHERE id = ?', [todoId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '待办事项不存在' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('删除待办事项失败:', err);
    res.status(500).json({ error: '删除待办事项失败' });
  }
};

// 删除所有已完成的待办事项
exports.deleteCompletedTodos = async (req, res) => {
  try {
    const result = await query('DELETE FROM todolist WHERE completed = 1');
    res.json({ message: `已删除 ${result.affectedRows} 个已完成的待办事项` });
  } catch (err) {
    console.error('删除已完成待办事项失败:', err);
    res.status(500).json({ error: '删除已完成待办事项失败' });
  }
};