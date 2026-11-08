import { useEffect, useMemo, useState } from 'react';
import { GanttChartSquare, KanbanSquare, List, Plus, Search, BarChart3, X } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import ListView from './ListView';
import TimelineView from './TimelineView';
import TaskModal from './TaskModal';
import ConfirmDialog from './ConfirmDialog';
import { btnPrimary, inputCls } from './ui';
import { PRIORITIES } from '../utils/format';
import { deleteTask, errMsg, patchTaskStatus } from '../services/api';
import { useLookups } from '../hooks/useLookups';
import { useToast } from '../hooks/useToast';

const VIEWS = [
  { key: 'board', label: 'Board', icon: KanbanSquare },
  { key: 'list', label: 'List', icon: List },
  { key: 'timeline', label: 'Timeline', icon: GanttChartSquare },
];

/**
 * Board / List / Timeline views over one set of tasks, with shared filters,
 * the create/edit modal, delete confirmation and optimistic status changes.
 * `analytics` (optional node) adds a fourth "Analytics" tab.
 */
export default function TaskViews({ tasks, onChanged, initialView = 'board', createDefaults = {}, hideProject, hideAssignee, analytics }) {
  const { projects, team } = useLookups();
  const toast = useToast();
  const [local, setLocal] = useState(tasks);
  const [view, setView] = useState(initialView === 'analytics' && !analytics ? 'board' : initialView);
  const [filters, setFilters] = useState({ search: '', project: '', assignee: '', priority: '' });
  const [modal, setModal] = useState({ open: false, taskId: null, defaults: {} });
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => setLocal(tasks), [tasks]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return local.filter((t) => (
      (!q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
      && (!filters.project || String(t.project_id) === filters.project)
      && (!filters.assignee || String(t.assignee_id) === filters.assignee)
      && (!filters.priority || t.priority === filters.priority)
    ));
  }, [local, filters]);

  const hasFilters = Object.values(filters).some(Boolean);
  const setF = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const openNew = (status) => setModal({ open: true, taskId: null, defaults: { ...createDefaults, ...(status ? { status } : {}) } });
  const openEdit = (id) => setModal({ open: true, taskId: id, defaults: {} });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  async function move(id, status) {
    const prev = local;
    setLocal((l) => l.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await patchTaskStatus(id, status);
      onChanged?.();
    } catch (e) {
      setLocal(prev);
      toast.error(errMsg(e));
    }
  }

  async function confirmDelete() {
    try {
      await deleteTask(toDelete.id);
      toast.success('Task deleted');
      setToDelete(null); closeModal();
      onChanged?.();
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  const tabs = analytics ? [...VIEWS, { key: 'analytics', label: 'Analytics', icon: BarChart3 }] : VIEWS;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-card" role="tablist" aria-label="Task views">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key} role="tab" aria-selected={view === key} onClick={() => setView(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${view === key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <button className={btnPrimary} onClick={() => openNew()}><Plus className="h-4 w-4" /> New task</button>
      </div>

      {view !== 'analytics' && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Search tasks" value={filters.search} onChange={setF('search')} aria-label="Search tasks" />
          </div>
          {!hideProject && (
            <select className={`${inputCls} lg:w-48`} value={filters.project} onChange={setF('project')} aria-label="Filter by project">
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {!hideAssignee && (
            <select className={`${inputCls} lg:w-44`} value={filters.assignee} onChange={setF('assignee')} aria-label="Filter by assignee">
              <option value="">All members</option>
              {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          <select className={`${inputCls} lg:w-40`} value={filters.priority} onChange={setF('priority')} aria-label="Filter by priority">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => setFilters({ search: '', project: '', assignee: '', priority: '' })} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
      )}

      {view === 'board' && <KanbanBoard tasks={filtered} onOpen={openEdit} onMove={move} onAdd={openNew} hideProject={hideProject} />}
      {view === 'list' && <ListView tasks={filtered} onOpen={openEdit} onDelete={setToDelete} onStatus={move} hideProject={hideProject} hideAssignee={hideAssignee} />}
      {view === 'timeline' && <TimelineView tasks={filtered} onOpen={openEdit} hideProject={hideProject} />}
      {view === 'analytics' && analytics}

      <TaskModal
        open={modal.open} taskId={modal.taskId} defaults={modal.defaults}
        onClose={closeModal} onChanged={onChanged} onDelete={setToDelete}
      />
      <ConfirmDialog
        open={Boolean(toDelete)} title="Delete this task?" onClose={() => setToDelete(null)} onConfirm={confirmDelete}
        message={`“${toDelete?.title}” and its subtasks and comments will be permanently deleted.`}
      />
    </div>
  );
}
