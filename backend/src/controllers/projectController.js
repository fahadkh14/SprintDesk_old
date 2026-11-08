const svc = require('../services/projectService');
const { asyncHandler } = require('../middleware/errors');

exports.list = asyncHandler(async (req, res) => res.json(await svc.list()));
exports.get = asyncHandler(async (req, res) => res.json(await svc.getById(Number(req.params.id))));
exports.create = asyncHandler(async (req, res) => res.status(201).json(await svc.create(req.body)));
exports.update = asyncHandler(async (req, res) => res.json(await svc.update(Number(req.params.id), req.body)));
exports.remove = asyncHandler(async (req, res) => {
  await svc.remove(Number(req.params.id));
  res.status(204).end();
});
