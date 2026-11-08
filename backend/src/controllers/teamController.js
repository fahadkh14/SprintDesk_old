const svc = require('../services/teamService');
const { asyncHandler } = require('../middleware/errors');

exports.list = asyncHandler(async (req, res) => res.json(await svc.list()));
