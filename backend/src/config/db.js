const mysql = require('mysql2/promise');
const { db } = require('./env');

// Connection pool shared by every service.
const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  waitForConnections: true,
  connectionLimit: db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true,     // DATE / DATETIME columns come back as plain strings
  decimalNumbers: true,  // DECIMAL results come back as numbers
  enableKeepAlive: true,
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function ping() {
  await pool.query('SELECT 1');
}

// MySQL may still be starting when the API boots; retry for a while.
async function waitForDb(retries = 30, delayMs = 2000) {
  for (let i = 1; i <= retries; i += 1) {
    try {
      await ping();
      console.log('[db] connected to MySQL');
      return true;
    } catch (err) {
      console.log(`[db] waiting for MySQL (${i}/${retries}): ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

module.exports = { pool, query, ping, waitForDb };
