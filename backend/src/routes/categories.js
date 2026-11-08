const router = require('express').Router();
router.get('/', require('../controllers/categoryController').list);
module.exports = router;
