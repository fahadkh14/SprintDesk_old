const { HttpError } = require('./errors');

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed'];

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isId = (v) => /^\d+$/.test(String(v)) && Number(v) > 0;
const isEmpty = (v) => v === undefined || v === null || v === '';

function fail(next, errors) {
  next(new HttpError(400, 'Validation failed', errors));
}

function validateId(req, res, next) {
  if (!isId(req.params.id)) return next(new HttpError(400, 'Invalid id: must be a positive integer'));
  return next();
}

function text(b, key, { required = false, max, errors }) {
  const v = b[key];
  if (isEmpty(v)) {
    if (required) errors.push(`${key} is required`);
    return required ? undefined : '';
  }
  if (typeof v !== 'string') { errors.push(`${key} must be a string`); return undefined; }
  const t = v.trim();
  if (required && !t) errors.push(`${key} is required`);
  if (t.length > max) errors.push(`${key} must be at most ${max} characters`);
  return t;
}

function dates(b, errors) {
  const out = {};
  ['start_date', 'due_date'].forEach((k) => {
    if (isEmpty(b[k])) out[k] = null;
    else if (!isDate(b[k])) { errors.push(`${k} must be a date in YYYY-MM-DD format`); out[k] = null; }
    else out[k] = b[k];
  });
  if (out.start_date && out.due_date && out.due_date < out.start_date) {
    errors.push('due_date cannot be earlier than start_date');
  }
  return out;
}

function optionalId(b, key, errors) {
  if (isEmpty(b[key])) return null;
  if (!isId(b[key])) { errors.push(`${key} must be a positive integer`); return null; }
  return Number(b[key]);
}

function validateProject(req, res, next) {
  const b = req.body || {};
  const errors = [];
  const out = {
    name: text(b, 'name', { required: true, max: 100, errors }),
    description: text(b, 'description', { max: 2000, errors }),
    status: isEmpty(b.status) ? 'active' : b.status,
    color: isEmpty(b.color) ? '#6938EF' : b.color,
    ...dates(b, errors),
  };
  if (!PROJECT_STATUSES.includes(out.status)) errors.push(`status must be one of: ${PROJECT_STATUSES.join(', ')}`);
  if (!/^#[0-9a-fA-F]{6}$/.test(out.color)) errors.push('color must be a hex colour such as #6938EF');
  if (errors.length) return fail(next, errors);
  req.body = out;
  return next();
}

function validateTask(req, res, next) {
  const b = req.body || {};
  const errors = [];
  const out = {
    title: text(b, 'title', { required: true, max: 200, errors }),
    description: text(b, 'description', { max: 5000, errors }),
    status: isEmpty(b.status) ? 'todo' : b.status,
    priority: isEmpty(b.priority) ? 'medium' : b.priority,
    project_id: null,
    category_id: optionalId(b, 'category_id', errors),
    assignee_id: optionalId(b, 'assignee_id', errors),
    ...dates(b, errors),
  };
  if (!isId(b.project_id)) errors.push('project_id is required and must be a positive integer');
  else out.project_id = Number(b.project_id);
  if (!STATUSES.includes(out.status)) errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  if (!PRIORITIES.includes(out.priority)) errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
  if (errors.length) return fail(next, errors);
  req.body = out;
  return next();
}

function validateStatus(req, res, next) {
  const status = (req.body || {}).status;
  if (!STATUSES.includes(status)) return fail(next, [`status must be one of: ${STATUSES.join(', ')}`]);
  req.body = { status };
  return next();
}

function validateSubtask(req, res, next) {
  const errors = [];
  const title = text(req.body || {}, 'title', { required: true, max: 200, errors });
  if (errors.length) return fail(next, errors);
  req.body = { title };
  return next();
}

function validateSubtaskUpdate(req, res, next) {
  const v = (req.body || {}).is_done;
  if (![true, false, 0, 1].includes(v)) return fail(next, ['is_done must be true or false']);
  req.body = { is_done: v ? 1 : 0 };
  return next();
}

function validateComment(req, res, next) {
  const b = req.body || {};
  const errors = [];
  const body = text(b, 'body', { required: true, max: 2000, errors });
  const author_id = optionalId(b, 'author_id', errors);
  if (errors.length) return fail(next, errors);
  req.body = { body, author_id };
  return next();
}

module.exports = {
  STATUSES, PRIORITIES, PROJECT_STATUSES,
  validateId, validateProject, validateTask, validateStatus,
  validateSubtask, validateSubtaskUpdate, validateComment,
};
