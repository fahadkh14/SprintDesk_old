import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { EmptyState, ErrorState, PageHeader, ProgressBar, ProjectStatusBadge, Spinner, btnPrimary, card, inputCls } from '../components/ui';
import ProjectModal from '../components/ProjectModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PROJECT_STATUSES, fmtDate } from '../utils/format';
import { deleteProject, errMsg, getProjects } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useLookups } from '../hooks/useLookups';
import { useToast } from '../hooks/useToast';

export default function Projects() {
  const { data, error, loading, refetch, reload } = useAsync(getProjects);
  const lookups = useLookups();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState({ open: false, project: null });
  const [toDelete, setToDelete] = useState(null);

  const list = useMemo(() => (data || []).filter((p) =>
    (!status || p.status === status) && (!search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase()))), [data, search, status]);

  const refreshAll = () => { reload(); lookups.refresh(); };

  async function remove() {
    try {
      await deleteProject(toDelete.id);
      toast.success('Project deleted');
      setToDelete(null); refreshAll();
    } catch (e) { toast.error(errMsg(e)); }
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading || !data) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Projects" subtitle={`${data.length} projects in the workspace.`}
        actions={<button className={btnPrimary} onClick={() => setModal({ open: true, project: null })}><Plus className="h-4 w-4" /> New project</button>}
      />
      <div className="mb-5 grid gap-2 sm:flex">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className={`${inputCls} pl-9`} placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search projects" />
        </div>
        <select className={`${inputCls} sm:w-44`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <div className={card}><EmptyState title="No projects found" text="Create a project to start planning work." action={<button className={btnPrimary} onClick={() => setModal({ open: true, project: null })}>New project</button>} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <article key={p.id} className={`${card} relative overflow-hidden transition hover:border-brand-300 hover:shadow-md`}>
              <div className="h-1.5" style={{ background: p.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold leading-snug text-slate-900">
                    <Link to={`/projects/${p.id}`} className="after:absolute after:inset-0 hover:text-brand-700">{p.name}</Link>
                  </h2>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">{p.description || 'No description yet.'}</p>
                <div className="mt-4 flex items-center gap-3">
                  <ProgressBar value={p.progress} color={p.color} className="flex-1" />
                  <span className="text-sm font-semibold text-slate-700">{p.progress}%</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{p.done_count}/{p.task_count} tasks</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{p.member_count}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{p.due_date ? fmtDate(p.due_date, { day: 'numeric', month: 'short', year: 'numeric' }) : 'No due date'}</span>
                  {p.overdue_count > 0 && <span className="font-medium text-rose-600">{p.overdue_count} overdue</span>}
                </div>
              </div>
              <div className="relative z-10 flex justify-end gap-1 border-t border-slate-100 px-3 py-2">
                <button onClick={() => setModal({ open: true, project: p })} aria-label={`Edit ${p.name}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setToDelete(p)} aria-label={`Delete ${p.name}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProjectModal open={modal.open} project={modal.project} onClose={() => setModal({ open: false, project: null })} onSaved={refreshAll} />
      <ConfirmDialog
        open={Boolean(toDelete)} title="Delete this project?" onClose={() => setToDelete(null)} onConfirm={remove}
        message={`“${toDelete?.name}” and all ${toDelete?.task_count ?? 0} of its tasks, subtasks and comments will be permanently deleted.`}
      />
    </>
  );
}
