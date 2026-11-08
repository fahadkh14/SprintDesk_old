import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Trash2 } from 'lucide-react';
import { Avatar, CategoryTag, EmptyState, PriorityBadge, card } from './ui';
import { STATUSES, dueLabel } from '../utils/format';

const PRI = { urgent: 0, high: 1, medium: 2, low: 3 };
const STA = { todo: 0, in_progress: 1, review: 2, done: 3 };
const sorters = {
  title: (a, b) => a.title.localeCompare(b.title),
  project: (a, b) => a.project_name.localeCompare(b.project_name),
  assignee: (a, b) => (a.assignee_name || '~').localeCompare(b.assignee_name || '~'),
  priority: (a, b) => PRI[a.priority] - PRI[b.priority],
  status: (a, b) => STA[a.status] - STA[b.status],
  due: (a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'),
};

export default function ListView({ tasks, onOpen, onDelete, onStatus, hideProject, hideAssignee }) {
  const [sort, setSort] = useState({ key: 'due', dir: 1 });
  const [status, setStatus] = useState('');

  const rows = useMemo(() => {
    const filtered = status ? tasks.filter((t) => t.status === status) : tasks;
    return [...filtered].sort((a, b) => sorters[sort.key](a, b) * sort.dir || a.id - b.id);
  }, [tasks, sort, status]);

  const Th = ({ k, children, className = '' }) => (
    <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 ${className}`}>
      <button onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }))} className="inline-flex items-center gap-1 hover:text-slate-800">
        {children}
        {sort.key === k ? (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <p className="text-sm text-slate-500">{rows.length} {rows.length === 1 ? 'task' : 'tasks'}</p>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {rows.length === 0 ? <EmptyState title="No tasks match" text="Try clearing the filters or create a new task." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50/70">
              <tr>
                <Th k="title">Task</Th>
                {!hideProject && <Th k="project">Project</Th>}
                {!hideAssignee && <Th k="assignee">Assignee</Th>}
                <Th k="priority">Priority</Th>
                <Th k="status">Status</Th>
                <Th k="due">Due</Th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="max-w-xs px-4 py-3">
                    <button onClick={() => onOpen(t.id)} className="text-left font-medium text-slate-900 hover:text-brand-700">{t.title}</button>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                      <CategoryTag name={t.category_name} color={t.category_color} />
                      {t.subtask_total > 0 && <span>{t.subtask_done}/{t.subtask_total} subtasks</span>}
                      {t.comment_count > 0 && <span>{t.comment_count} comments</span>}
                    </div>
                  </td>
                  {!hideProject && (
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: t.project_color }} />{t.project_name}</span>
                    </td>
                  )}
                  {!hideAssignee && (
                    <td className="px-4 py-3">
                      {t.assignee_name
                        ? <span className="inline-flex items-center gap-2 text-slate-700"><Avatar name={t.assignee_name} color={t.assignee_color} size={24} />{t.assignee_name}</span>
                        : <span className="text-slate-400">Unassigned</span>}
                    </td>
                  )}
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3">
                    <select value={t.status} onChange={(e) => onStatus(t.id, e.target.value)} aria-label={`Status of ${t.title}`}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
                      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 ${t.is_overdue ? 'font-semibold text-rose-600' : 'text-slate-600'}`}>{dueLabel(t)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => onOpen(t.id)} aria-label={`Edit ${t.title}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(t)} aria-label={`Delete ${t.title}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
