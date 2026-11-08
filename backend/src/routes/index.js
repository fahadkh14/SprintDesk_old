const router = require('express').Router();

router.get('/', (req, res) =>
  res.json({
    name: 'SprintDesk API',
    version: '1.0.0',
    endpoints: ['/api/projects', '/api/tasks', '/api/team', '/api/categories', '/api/dashboard/stats', '/api/dashboard/analytics', '/health'],
  }));

router.use('/projects', require('./projects'));
router.use('/tasks', require('./tasks'));
router.use('/subtasks', require('./subtasks'));
router.use('/team', require('./team'));
router.use('/categories', require('./categories'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;
