const { query } = require('../config/db');

async function list() {
  return query(`
    SELECT c.id, c.name, c.color, COUNT(t.id) AS task_count
    FROM categories c LEFT JOIN tasks t ON t.category_id = c.id
    GROUP BY c.id ORDER BY c.id`);
}

module.exports = { list };
