const router = require('express').Router();
const c = require('../controllers/projectController');
const { validateId, validateProject } = require('../middleware/validate');

router.get('/', c.list);
router.post('/', validateProject, c.create);
router.get('/:id', validateId, c.get);
router.put('/:id', validateId, validateProject, c.update);
router.delete('/:id', validateId, c.remove);

module.exports = router;
