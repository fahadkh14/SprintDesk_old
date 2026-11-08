const svc = require('../services/taskService');
const { asyncHandler } = require('../middleware/errors');

const id = (req) => Number(req.params.id);

exports.list = asyncHandler(async (req, res) => res.json(await svc.list(req.query)));
exports.get = asyncHandler(async (req, res) => res.json(await svc.getById(id(req))));
exports.create = asyncHandler(async (req, res) => res.status(201).json(await svc.create(req.body)));
exports.update = asyncHandler(async (req, res) => res.json(await svc.update(id(req), req.body)));
exports.updateStatus = asyncHandler(async (req, res) => res.json(await svc.updateStatus(id(req), req.body.status)));
exports.remove = asyncHandler(async (req, res) => {
  await svc.remove(id(req));
  res.status(204).end();
});

exports.listSubtasks = asyncHandler(async (req, res) => res.json(await svc.listSubtasks(id(req))));
exports.createSubtask = asyncHandler(async (req, res) => res.status(201).json(await svc.createSubtask(id(req), req.body.title)));
exports.updateSubtask = asyncHandler(async (req, res) => res.json(await svc.updateSubtask(id(req), req.body.is_done)));
exports.removeSubtask = asyncHandler(async (req, res) => {
  await svc.removeSubtask(id(req));
  res.status(204).end();
});

exports.listComments = asyncHandler(async (req, res) => res.json(await svc.listComments(id(req))));
exports.createComment = asyncHandler(async (req, res) => res.status(201).json(await svc.createComment(id(req), req.body)));
