require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 5761,
  host: '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'sprintdesk',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sprintdesk',
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  },
};
