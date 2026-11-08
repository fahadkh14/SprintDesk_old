import axios from 'axios';

// Relative base URL: Nginx (Docker) and the Vite dev server both proxy /api to the backend.
const http = axios.create({ baseURL: '/api', timeout: 15000 });

export function errMsg(e) {
  const data = e?.response?.data;
  if (data?.details?.length) return `${data.error}: ${data.details.join('; ')}`;
  if (data?.error) return data.error;
  if (e?.code === 'ECONNABORTED') return 'The server took too long to respond.';
  if (!e?.response) return 'Cannot reach the SprintDesk API. Check that the backend is running.';
  return e.message || 'Something went wrong.';
}

const get = (url, params) => http.get(url, { params }).then((r) => r.data);

// Projects
export const getProjects = () => get('/projects');
export const getProject = (id) => get(`/projects/${id}`);
export const createProject = (b) => http.post('/projects', b).then((r) => r.data);
export const updateProject = (id, b) => http.put(`/projects/${id}`, b).then((r) => r.data);
export const deleteProject = (id) => http.delete(`/projects/${id}`);

// Tasks
export const getTasks = (params) => get('/tasks', params);
export const getTask = (id) => get(`/tasks/${id}`);
export const createTask = (b) => http.post('/tasks', b).then((r) => r.data);
export const updateTask = (id, b) => http.put(`/tasks/${id}`, b).then((r) => r.data);
export const patchTaskStatus = (id, status) => http.patch(`/tasks/${id}/status`, { status }).then((r) => r.data);
export const deleteTask = (id) => http.delete(`/tasks/${id}`);

// Subtasks & comments
export const addSubtask = (taskId, title) => http.post(`/tasks/${taskId}/subtasks`, { title }).then((r) => r.data);
export const setSubtaskDone = (id, is_done) => http.patch(`/subtasks/${id}`, { is_done }).then((r) => r.data);
export const deleteSubtask = (id) => http.delete(`/subtasks/${id}`);
export const addComment = (taskId, body, author_id) => http.post(`/tasks/${taskId}/comments`, { body, author_id }).then((r) => r.data);

// Reference data & dashboard
export const getTeam = () => get('/team');
export const getCategories = () => get('/categories');
export const getStats = () => get('/dashboard/stats');
export const getAnalytics = () => get('/dashboard/analytics');
export const getHealth = () => axios.get('/health', { timeout: 8000, validateStatus: () => true }).then((r) => ({ httpStatus: r.status, ...r.data }));
