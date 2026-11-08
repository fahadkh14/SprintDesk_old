const svc = require('../services/dashboardService');
const { asyncHandler } = require('../middleware/errors');

exports.stats = asyncHandler(async (req, res) => res.json(await svc.stats()));
exports.analytics = asyncHandler(async (req, res) => res.json(await svc.analytics()));
