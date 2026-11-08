const router = require('express').Router();
router.get('/', require('../controllers/teamController').list);
module.exports = router;
