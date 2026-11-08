const router = require('express').Router();
const c = require('../controllers/taskController');
const v = require('../middleware/validate');

router.get('/', c.list);
router.post('/', v.validateTask, c.create);
router.get('/:id', v.validateId, c.get);
router.put('/:id', v.validateId, v.validateTask, c.update);
router.patch('/:id/status', v.validateId, v.validateStatus, c.updateStatus);
router.delete('/:id', v.validateId, c.remove);

router.get('/:id/subtasks', v.validateId, c.listSubtasks);
router.post('/:id/subtasks', v.validateId, v.validateSubtask, c.createSubtask);

router.get('/:id/comments', v.validateId, c.listComments);
router.post('/:id/comments', v.validateId, v.validateComment, c.createComment);

module.exports = router;
