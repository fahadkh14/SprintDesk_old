const { query } = require('../config/db');

async function list() {
  return query(`
    SELECT m.id, m.name, m.email, m.job_title, m.avatar_color,
           COUNT(t.id) AS assigned_count,
           COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS completed_count,
           COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS in_progress_count,
           COUNT(CASE WHEN t.status <> 'done' AND t.due_date < CURDATE() THEN 1 END) AS overdue_count
    FROM team_members m LEFT JOIN tasks t ON t.assignee_id = m.id
    GROUP BY m.id ORDER BY m.id`);
}

module.exports = { list };
