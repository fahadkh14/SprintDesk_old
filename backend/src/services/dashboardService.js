const { query } = require('../config/db');
const { STATUSES, PRIORITIES } = require('../middleware/validate');
const projectService = require('./projectService');
const teamService = require('./teamService');
const categoryService = require('./categoryService');
const taskService = require('./taskService');

async function stats() {
  const [t] = await query(`
    SELECT COUNT(*) AS total_tasks,
      COUNT(CASE WHEN status = 'todo' THEN 1 END) AS todo_tasks,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress_tasks,
      COUNT(CASE WHEN status = 'review' THEN 1 END) AS review_tasks,
      COUNT(CASE WHEN status = 'done' THEN 1 END) AS completed_tasks,
      COUNT(CASE WHEN status <> 'done' AND due_date < CURDATE() THEN 1 END) AS overdue_tasks,
      COUNT(CASE WHEN status <> 'done' AND due_date BETWEEN CURDATE() AND CURDATE() + INTERVAL 7 DAY THEN 1 END) AS due_this_week
    FROM tasks`);
  const [p] = await query('SELECT COUNT(*) AS n FROM projects');
  const [m] = await query('SELECT COUNT(*) AS n FROM team_members');
  return {
    ...t,
    total_projects: p.n,
    total_members: m.n,
    completion_percentage: t.total_tasks ? Math.round((t.completed_tasks / t.total_tasks) * 100) : 0,
  };
}

async function grouped(column, values) {
  const rows = await query(`SELECT ${column} AS k, COUNT(*) AS n FROM tasks GROUP BY ${column}`);
  const map = Object.fromEntries(rows.map((r) => [r.k, r.n]));
  return values.map((v) => ({ [column]: v, count: map[v] || 0 }));
}

async function analytics() {
  const [s, byStatus, byPriority, projects, workload, byCategory, upcoming, activity] = await Promise.all([
    stats(),
    grouped('status', STATUSES),
    grouped('priority', PRIORITIES),
    projectService.list(),
    teamService.list(),
    categoryService.list(),
    taskService.upcoming(8),
    query(`
      SELECT c.id, c.task_id, c.body, c.created_at, t.title AS task_title, p.name AS project_name,
             m.name AS author_name, m.avatar_color AS author_color
      FROM comments c JOIN tasks t ON t.id = c.task_id JOIN projects p ON p.id = t.project_id
      LEFT JOIN team_members m ON m.id = c.author_id
      ORDER BY c.created_at DESC, c.id DESC LIMIT 6`),
  ]);
  return {
    total_projects: s.total_projects,
    total_tasks: s.total_tasks,
    completion_percentage: s.completion_percentage,
    by_status: byStatus,
    by_priority: byPriority,
    project_progress: projects.map((p) => ({
      id: p.id, name: p.name, color: p.color, status: p.status,
      total: p.task_count, done: p.done_count, in_progress: p.in_progress_count,
      overdue: p.overdue_count, progress: p.progress,
    })),
    by_category: byCategory,
    workload,
    upcoming,
    recent_activity: activity,
  };
}

module.exports = { stats, analytics };
