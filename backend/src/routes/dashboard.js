const router = require('express').Router();
const c = require('../controllers/dashboardController');

router.get('/stats', c.stats);
router.get('/analytics', c.analytics);

module.exports = router;
