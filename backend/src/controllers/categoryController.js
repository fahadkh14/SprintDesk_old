const svc = require('../services/categoryService');
const { asyncHandler } = require('../middleware/errors');

exports.list = asyncHandler(async (req, res) => res.json(await svc.list()));
