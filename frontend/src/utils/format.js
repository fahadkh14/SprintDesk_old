export const STATUSES = [
  { value: 'todo', label: 'To Do', color: '#98A2B3', badge: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'In Progress', color: '#2E90FA', badge: 'bg-blue-50 text-blue-700' },
  { value: 'review', label: 'Review', color: '#F79009', badge: 'bg-amber-50 text-amber-700' },
  { value: 'done', label: 'Done', color: '#12B76A', badge: 'bg-emerald-50 text-emerald-700' },
];
export const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#98A2B3', badge: 'bg-slate-100 text-slate-600' },
  { value: 'medium', label: 'Medium', color: '#0BA5EC', badge: 'bg-sky-50 text-sky-700' },
  { value: 'high', label: 'High', color: '#F79009', badge: 'bg-orange-50 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: '#F04438', badge: 'bg-rose-50 text-rose-700' },
];
export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', badge: 'bg-slate-100 text-slate-700' },
  { value: 'active', label: 'Active', badge: 'bg-emerald-50 text-emerald-700' },
  { value: 'on_hold', label: 'On hold', badge: 'bg-amber-50 text-amber-700' },
  { value: 'completed', label: 'Completed', badge: 'bg-brand-50 text-brand-700' },
];
export const PROJECT_COLORS = ['#7A5AF8', '#2E90FA', '#0BA5EC', '#EE46BC', '#F79009', '#12B76A', '#F04438', '#667085'];

const toMap = (arr) => Object.fromEntries(arr.map((x) => [x.value, x]));
export const STATUS_MAP = toMap(STATUSES);
export const PRIORITY_MAP = toMap(PRIORITIES);
export const PROJECT_STATUS_MAP = toMap(PROJECT_STATUSES);

export const MS_DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toKey(new Date());
export const parseDate = (s) => (s ? new Date(`${String(s).slice(0, 10)}T00:00:00`) : null);
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const diffDays = (a, b) => Math.round((b - a) / MS_DAY);

export function fmtDate(s, opts = { day: 'numeric', month: 'short' }) {
  const d = parseDate(s);
  return d ? d.toLocaleDateString('en-GB', opts) : 'No date';
}
export const fmtLongDate = (s) => fmtDate(s, { day: 'numeric', month: 'short', year: 'numeric' });

export function fmtRelative(ts) {
  if (!ts) return '';
  const d = new Date(String(ts).replace(' ', 'T') + (String(ts).includes('Z') || String(ts).includes('+') ? '' : 'Z'));
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days < 30 ? `${days}d ago` : fmtDate(String(ts).slice(0, 10));
}

export function dueLabel(task) {
  if (!task.due_date) return 'No due date';
  if (task.status === 'done') return fmtDate(task.due_date);
  const n = diffDays(parseDate(todayKey()), parseDate(task.due_date));
  if (n < 0) return `${-n}d overdue`;
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  return fmtDate(task.due_date);
}

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
