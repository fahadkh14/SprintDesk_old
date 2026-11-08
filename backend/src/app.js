const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const { pool, ping, waitForDb } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`));
  next();
});

// Liveness + database connectivity (used by Docker health checks)
app.get('/health', async (req, res) => {
  const base = { service: 'sprintdesk-backend', uptime_seconds: Math.round(process.uptime()), timestamp: new Date().toISOString() };
  try {
    await ping();
    res.json({ status: 'ok', database: 'up', ...base });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'down', ...base });
  }
});

app.use('/api', require('./routes'));
app.use(notFound);
app.use(errorHandler);

let server;
(async () => {
  server = app.listen(config.port, config.host, () =>
    console.log(`[sprintdesk] API listening on http://${config.host}:${config.port}`));
  await waitForDb();
})();

const shutdown = (signal) => {
  console.log(`[sprintdesk] ${signal} received, shutting down`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
['SIGTERM', 'SIGINT'].forEach((s) => process.on(s, () => shutdown(s)));

module.exports = app;
