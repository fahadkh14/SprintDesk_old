const { query } = require('../config/db');
const { HttpError } = require('../middleware/errors');
const taskService = require('./taskService');

const LIST_SQL = `
  SELECT p.id, p.name, p.description, p.status, p.color, p.start_date, p.due_date, p.created_at, p.updated_at,
         COUNT(t.id) AS task_count,
         COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS done_count,
         COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS in_progress_count,
         COUNT(CASE WHEN t.status <> 'done' AND t.due_date < CURDATE() THEN 1 END) AS overdue_count,
         COUNT(DISTINCT t.assignee_id) AS member_count,
         ROUND(COALESCE(COUNT(CASE WHEN t.status = 'done' THEN 1 END) / NULLIF(COUNT(t.id), 0) * 100, 0)) AS progress
  FROM projects p LEFT JOIN tasks t ON t.project_id = p.id`;

async function list() {
  return query(`${LIST_SQL} GROUP BY p.id ORDER BY p.id`);
}

async function getById(id) {
  const rows = await query(`${LIST_SQL} WHERE p.id = ? GROUP BY p.id`, [id]);
  if (!rows.length) throw new HttpError(404, `Project ${id} not found`);
  const tasks = await taskService.list({ project_id: id });
  return { ...rows[0], tasks };
}

const fields = (b) => [b.name, b.description, b.status, b.color, b.start_date, b.due_date];

async function create(b) {
  const r = await query(
    'INSERT INTO projects (name, description, status, color, start_date, due_date) VALUES (?, ?, ?, ?, ?, ?)',
    fields(b),
  );
  return getById(r.insertId);
}

async function update(id, b) {
  const rows = await query('SELECT id FROM projects WHERE id = ?', [id]);
  if (!rows.length) throw new HttpError(404, `Project ${id} not found`);
  await query(
    'UPDATE projects SET name = ?, description = ?, status = ?, color = ?, start_date = ?, due_date = ? WHERE id = ?',
    [...fields(b), id],
  );
  return getById(id);
}

async function remove(id) {
  const rows = await query('SELECT id FROM projects WHERE id = ?', [id]);
  if (!rows.length) throw new HttpError(404, `Project ${id} not found`);
  await query('DELETE FROM projects WHERE id = ?', [id]); // tasks, subtasks and comments cascade
}

module.exports = { list, getById, create, update, remove };
