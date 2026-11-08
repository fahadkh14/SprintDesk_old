import { Link } from 'react-router-dom';
import { CalendarClock, FolderKanban, Gauge, Users } from 'lucide-react';
import { Avatar, ErrorState, PageHeader, ProgressBar, ProjectStatusBadge, Spinner, StatCard, card } from '../components/ui';
import { dueLabel, fmtRelative } from '../utils/format';
import { getAnalytics, getProjects, getStats } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useSettings } from '../hooks/useSettings';

export default function Overview() {
  const { activeMember } = useSettings();
  const stats = useAsync(getStats);
  const analytics = useAsync(getAnalytics);
  const projects = useAsync(getProjects);

  const error = stats.error || analytics.error || projects.error;
  if (error) return <ErrorState message={error} onRetry={() => { stats.refetch(); analytics.refetch(); projects.refetch(); }} />;
  if (!stats.data || !analytics.data || !projects.data) return <Spinner />;

  const s = stats.data;
  const a = analytics.data;
  const first = activeMember?.name.split(' ')[0];

  return (
    <>
      <PageHeader title={`Welcome back${first ? `, ${first}` : ''}`} subtitle="Here is where every project and team stands today." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={s.total_projects} hint="Across the workspace" icon={FolderKanban} tone="brand" />
        <StatCard label="Team members" value={s.total_members} hint="Contributing to tasks" icon={Users} tone="blue" />
        <StatCard label="Overall completion" value={`${s.completion_percentage}%`} hint={`${s.completed_tasks} of ${s.total_tasks} tasks done`} icon={Gauge} tone="green" />
        <StatCard label="Due in 7 days" value={s.due_this_week} hint={`${s.overdue_tasks} already overdue`} icon={CalendarClock} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Project progress</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.data.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className={`${card} block p-5 transition hover:border-brand-300 hover:shadow-md`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900"><span className="h-3 w-3 rounded-full" style={{ background: p.color }} />{p.name}</h3>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <ProgressBar value={p.progress} color={p.color} className="flex-1" />
                  <span className="text-sm font-semibold text-slate-700">{p.progress}%</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{p.done_count} of {p.task_count} tasks done{p.overdue_count > 0 && <span className="font-medium text-rose-600"> · {p.overdue_count} overdue</span>}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${card} p-5`}>
          <h2 className="text-base font-semibold text-slate-900">Upcoming deadlines</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {a.upcoming.map((t) => (
              <li key={t.id}>
                <Link to={`/projects/${t.project_id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-brand-700">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">{t.title}</span>
                    <span className="block truncate text-xs text-slate-500">{t.project_name}</span>
                  </span>
                  <span className={`shrink-0 text-xs font-medium ${t.is_overdue ? 'text-rose-600' : 'text-slate-500'}`}>{dueLabel(t)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${card} p-5 xl:col-span-2`}>
          <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
          <ul className="mt-3 space-y-4">
            {a.recent_activity.map((c) => (
              <li key={c.id} className="flex gap-3">
                <Avatar name={c.author_name || 'Guest'} color={c.author_color || '#98A2B3'} size={32} />
                <div className="min-w-0">
                  <p className="text-sm text-slate-700"><b className="font-semibold text-slate-900">{c.author_name || 'Guest'}</b> commented on <span className="font-medium">{c.task_title}</span> <span className="text-xs text-slate-400">· {fmtRelative(c.created_at)}</span></p>
                  <p className="mt-0.5 text-sm text-slate-500">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${card} p-5`}>
          <h2 className="text-base font-semibold text-slate-900">Team workload</h2>
          <ul className="mt-3 space-y-3">
            {a.workload.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <Avatar name={m.name} color={m.avatar_color} size={28} />
                <span className="w-24 truncate text-sm text-slate-700">{m.name.split(' ')[0]}</span>
                <ProgressBar value={m.assigned_count ? Math.round((m.completed_count / m.assigned_count) * 100) : 0} color={m.avatar_color} className="flex-1" />
                <span className="w-10 text-right text-xs text-slate-500">{m.completed_count}/{m.assigned_count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
