const { query } = require('../config/db');
const { HttpError } = require('../middleware/errors');
const { STATUSES, PRIORITIES } = require('../middleware/validate');

const BASE = `
  SELECT t.id, t.project_id, t.category_id, t.assignee_id, t.title, t.description,
         t.status, t.priority, t.start_date, t.due_date, t.completed_at, t.created_at, t.updated_at,
         p.name AS project_name, p.color AS project_color,
         c.name AS category_name, c.color AS category_color,
         m.name AS assignee_name, m.avatar_color AS assignee_color, m.job_title AS assignee_title,
         (t.due_date IS NOT NULL AND t.due_date < CURDATE() AND t.status <> 'done') AS is_overdue,
         (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id) AS subtask_total,
         (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id AND s.is_done = 1) AS subtask_done,
         (SELECT COUNT(*) FROM comments cm WHERE cm.task_id = t.id) AS comment_count
  FROM tasks t
  JOIN projects p ON p.id = t.project_id
  LEFT JOIN categories c ON c.id = t.category_id
  LEFT JOIN team_members m ON m.id = t.assignee_id`;

const SORTS = {
  due_date: (d) => `t.due_date IS NULL, t.due_date ${d}`,
  priority: (d) => `FIELD(t.priority, 'urgent', 'high', 'medium', 'low') ${d}`,
  status: (d) => `FIELD(t.status, 'todo', 'in_progress', 'review', 'done') ${d}`,
  title: (d) => `t.title ${d}`,
  project: (d) => `p.name ${d}`,
  created_at: (d) => `t.created_at ${d}`,
};

const shape = (r) => ({ ...r, is_overdue: !!r.is_overdue });

async function list(f = {}) {
  const where = [];
  const params = [];
  const idFilters = { project_id: 't.project_id', assignee_id: 't.assignee_id', category_id: 't.category_id' };
  Object.entries(idFilters).forEach(([key, col]) => {
    if (f[key] === undefined || f[key] === '') return;
    if (!/^\d+$/.test(String(f[key]))) throw new HttpError(400, `${key} must be a positive integer`);
    where.push(`${col} = ?`);
    params.push(Number(f[key]));
  });
  if (f.status) {
    if (!STATUSES.includes(f.status)) throw new HttpError(400, `status must be one of: ${STATUSES.join(', ')}`);
    where.push('t.status = ?'); params.push(f.status);
  }
  if (f.priority) {
    if (!PRIORITIES.includes(f.priority)) throw new HttpError(400, `priority must be one of: ${PRIORITIES.join(', ')}`);
    where.push('t.priority = ?'); params.push(f.priority);
  }
  if (f.search) {
    const s = `%${String(f.search).trim()}%`;
    where.push('(t.title LIKE ? OR t.description LIKE ?)'); params.push(s, s);
  }
  if (f.overdue === 'true') where.push("t.due_date < CURDATE() AND t.status <> 'done'");

  const dir = String(f.order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const orderBy = (SORTS[f.sort] || SORTS.due_date)(dir);
  const sql = `${BASE} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${orderBy}, t.id ASC`;
  return (await query(sql, params)).map(shape);
}

async function upcoming(limit = 8) {
  const sql = `${BASE} WHERE t.status <> 'done' AND t.due_date IS NOT NULL ORDER BY t.due_date ASC, t.id ASC LIMIT ?`;
  return (await query(sql, [limit])).map(shape);
}

async function ensureTask(id) {
  const rows = await query('SELECT id FROM tasks WHERE id = ?', [id]);
  if (!rows.length) throw new HttpError(404, `Task ${id} not found`);
}

async function getById(id) {
  const rows = await query(`${BASE} WHERE t.id = ?`, [id]);
  if (!rows.length) throw new HttpError(404, `Task ${id} not found`);
  const [subtasks, comments] = await Promise.all([listSubtasks(id), listComments(id)]);
  return { ...shape(rows[0]), subtasks, comments };
}

const fields = (b) => [b.project_id, b.category_id, b.assignee_id, b.title, b.description, b.status, b.priority, b.start_date, b.due_date];

async function create(b) {
  const result = await query(
    `INSERT INTO tasks (project_id, category_id, assignee_id, title, description, status, priority, start_date, due_date, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? = 'done', NOW(), NULL))`,
    [...fields(b), b.status],
  );
  return getById(result.insertId);
}

async function update(id, b) {
  await ensureTask(id);
  await query(
    `UPDATE tasks SET project_id = ?, category_id = ?, assignee_id = ?, title = ?, description = ?,
       status = ?, priority = ?, start_date = ?, due_date = ?,
       completed_at = IF(? = 'done', COALESCE(completed_at, NOW()), NULL)
     WHERE id = ?`,
    [...fields(b), b.status, id],
  );
  return getById(id);
}

async function updateStatus(id, status) {
  await ensureTask(id);
  await query(
    "UPDATE tasks SET status = ?, completed_at = IF(? = 'done', COALESCE(completed_at, NOW()), NULL) WHERE id = ?",
    [status, status, id],
  );
  return getById(id);
}

async function remove(id) {
  await ensureTask(id);
  await query('DELETE FROM tasks WHERE id = ?', [id]);
}

/* ---------- subtasks ---------- */
const shapeSub = (r) => ({ ...r, is_done: !!r.is_done });

async function listSubtasks(taskId) {
  const rows = await query('SELECT id, task_id, title, is_done, created_at FROM subtasks WHERE task_id = ? ORDER BY id', [taskId]);
  return rows.map(shapeSub);
}

async function listSubtasksFor(taskId) {
  await ensureTask(taskId);
  return listSubtasks(taskId);
}

async function createSubtask(taskId, title) {
  await ensureTask(taskId);
  const r = await query('INSERT INTO subtasks (task_id, title) VALUES (?, ?)', [taskId, title]);
  const rows = await query('SELECT id, task_id, title, is_done, created_at FROM subtasks WHERE id = ?', [r.insertId]);
  return shapeSub(rows[0]);
}

async function updateSubtask(id, isDone) {
  const rows = await query('SELECT id FROM subtasks WHERE id = ?', [id]);
  if (!rows.length) throw new HttpError(404, `Subtask ${id} not found`);
  await query('UPDATE subtasks SET is_done = ? WHERE id = ?', [isDone, id]);
  const out = await query('SELECT id, task_id, title, is_done, created_at FROM subtasks WHERE id = ?', [id]);
  return shapeSub(out[0]);
}

async function removeSubtask(id) {
  const rows = await query('SELECT id FROM subtasks WHERE id = ?', [id]);
  if (!rows.length) throw new HttpError(404, `Subtask ${id} not found`);
  await query('DELETE FROM subtasks WHERE id = ?', [id]);
}

/* ---------- comments ---------- */
const COMMENT_SQL = `
  SELECT c.id, c.task_id, c.author_id, c.body, c.created_at,
         m.name AS author_name, m.avatar_color AS author_color
  FROM comments c LEFT JOIN team_members m ON m.id = c.author_id`;

async function listComments(taskId) {
  return query(`${COMMENT_SQL} WHERE c.task_id = ? ORDER BY c.created_at, c.id`, [taskId]);
}

async function listCommentsFor(taskId) {
  await ensureTask(taskId);
  return listComments(taskId);
}

async function createComment(taskId, { body, author_id }) {
  await ensureTask(taskId);
  const r = await query('INSERT INTO comments (task_id, author_id, body) VALUES (?, ?, ?)', [taskId, author_id, body]);
  const rows = await query(`${COMMENT_SQL} WHERE c.id = ?`, [r.insertId]);
  return rows[0];
}

module.exports = {
  list, upcoming, getById, create, update, updateStatus, remove,
  listSubtasks: listSubtasksFor, createSubtask, updateSubtask, removeSubtask,
  listComments: listCommentsFor, createComment,
};
