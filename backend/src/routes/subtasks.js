const router = require('express').Router();
const c = require('../controllers/taskController');
const v = require('../middleware/validate');

router.patch('/:id', v.validateId, v.validateSubtaskUpdate, c.updateSubtask);
router.delete('/:id', v.validateId, c.removeSubtask);

module.exports = router;
