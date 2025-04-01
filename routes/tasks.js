const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
}

// Получить задачи
router.get('/', authenticateToken, async (req, res) => {
  const tasks = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY id DESC', [req.userId]);
  res.json(tasks.rows);
});

// Добавить задачу
router.post('/', authenticateToken, async (req, res) => {
  const { title, due_date } = req.body;
  const newTask = await pool.query(
    'INSERT INTO tasks (user_id, title, due_date) VALUES ($1, $2, $3) RETURNING *',
    [req.userId, title, due_date]
  );
  res.status(201).json(newTask.rows[0]);
});

// Обновить задачу (выполнено или нет)
router.patch('/:id', authenticateToken, async (req, res) => {
  const { completed } = req.body;
  const task = await pool.query(
    'UPDATE tasks SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [completed, req.params.id, req.userId]
  );
  res.json(task.rows[0]);
});

// Удалить задачу
router.delete('/:id', authenticateToken, async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.sendStatus(204);
});

module.exports = router;

