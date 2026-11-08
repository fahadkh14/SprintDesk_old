import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { ErrorState, ProgressBar, ProjectStatusBadge, Spinner, btnGhost, btnDanger, card } from '../components/ui';
import TaskViews from '../components/TaskViews';
import ProjectModal from '../components/ProjectModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { fmtLongDate } from '../utils/format';
import { deleteProject, errMsg, getProject } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useLookups } from '../hooks/useLookups';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const lookups = useLookups();
  const { settings } = useSettings();
  const { data: p, error, loading, refetch, reload } = useAsync(() => getProject(id), [id]);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (error) return <><Link to="/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-brand-700"><ArrowLeft className="h-4 w-4" /> All projects</Link><ErrorState message={error} onRetry={refetch} /></>;
  if (loading || !p) return <Spinner />;

  async function remove() {
    try {
      await deleteProject(p.id);
      toast.success('Project deleted');
      lookups.refresh();
      navigate('/projects');
    } catch (e) { toast.error(errMsg(e)); }
  }

  const stat = (label, value, cls = 'text-slate-900') => (
    <div className="rounded-xl bg-slate-50 px-4 py-3"><dt className="text-xs text-slate-500">{label}</dt><dd className={`text-xl font-semibold ${cls}`}>{value}</dd></div>
  );

  return (
    <>
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" /> All projects</Link>
      <section className={`${card} mb-6 overflow-hidden`}>
        <div className="h-1.5" style={{ background: p.color }} />
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{p.name}</h1>
                <ProjectStatusBadge status={p.status} />
              </div>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">{p.description || 'No description yet.'}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500"><CalendarDays className="h-4 w-4" />
                {p.start_date ? fmtLongDate(p.start_date) : 'No start date'} to {p.due_date ? fmtLongDate(p.due_date) : 'no due date'}
              </p>
            </div>
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit</button>
              <button className={btnDanger} onClick={() => setDeleting(true)}><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <ProgressBar value={p.progress} color={p.color} className="flex-1" />
            <span className="text-sm font-semibold text-slate-700">{p.progress}% complete</span>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stat('Tasks', p.task_count)}
            {stat('Completed', p.done_count, 'text-emerald-600')}
            {stat('In progress', p.in_progress_count, 'text-blue-600')}
            {stat('Overdue', p.overdue_count, p.overdue_count ? 'text-rose-600' : 'text-slate-900')}
          </dl>
        </div>
      </section>

      <h2 className="mb-3 text-base font-semibold text-slate-900">Project tasks</h2>
      <TaskViews
        tasks={p.tasks} onChanged={() => { reload(); lookups.refresh(); }} initialView={settings.defaultView === 'analytics' ? 'board' : settings.defaultView}
        createDefaults={{ project_id: p.id }} hideProject
      />

      <ProjectModal open={editing} project={p} onClose={() => setEditing(false)} onSaved={() => { reload(); lookups.refresh(); }} />
      <ConfirmDialog
        open={deleting} title="Delete this project?" onClose={() => setDeleting(false)} onConfirm={remove}
        message={`“${p.name}” and all ${p.task_count} of its tasks, subtasks and comments will be permanently deleted.`}
      />
    </>
  );
}
