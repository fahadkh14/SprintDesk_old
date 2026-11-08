import { Link } from 'react-router-dom';
import { Avatar, ErrorState, PageHeader, ProgressBar, ProjectStatusBadge, Spinner, card } from '../components/ui';
import { getAnalytics, getStats } from '../services/api';
import { useAsync } from '../hooks/useAsync';

export default function Workspace() {
  const stats = useAsync(getStats);
  const analytics = useAsync(getAnalytics);
  const error = stats.error || analytics.error;
  if (error) return <ErrorState message={error} onRetry={() => { stats.refetch(); analytics.refetch(); }} />;
  if (!stats.data || !analytics.data) return <Spinner />;

  const s = stats.data;
  const a = analytics.data;
  const maxCat = Math.max(1, ...a.by_category.map((c) => c.task_count));

  return (
    <>
      <PageHeader title="Workspace" subtitle={`${s.total_projects} projects, ${s.total_members} members and ${s.total_tasks} tasks in one place.`} />

      <section className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Task categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {a.by_category.map((c) => (
            <div key={c.id} className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900"><span className="h-3 w-3 rounded-md" style={{ background: c.color }} />{c.name}</h3>
                <span className="text-2xl font-semibold text-slate-900">{c.task_count}</span>
              </div>
              <ProgressBar value={Math.round((c.task_count / maxCat) * 100)} color={c.color} className="mt-4" />
              <p className="mt-2 text-xs text-slate-500">{c.task_count === 1 ? '1 task' : `${c.task_count} tasks`} in this category</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className={`${card} overflow-hidden xl:col-span-2`}>
          <h2 className="px-5 pt-5 text-base font-semibold text-slate-900">Projects</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50/70 text-left text-xs font-semibold text-slate-500">
                <tr><th className="px-5 py-3">Project</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Tasks</th><th className="px-3 py-3">Overdue</th><th className="px-5 py-3">Progress</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {a.project_progress.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3"><Link to={`/projects/${p.id}`} className="inline-flex items-center gap-2 font-medium text-slate-900 hover:text-brand-700"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.name}</Link></td>
                    <td className="px-3 py-3"><ProjectStatusBadge status={p.status} /></td>
                    <td className="px-3 py-3 text-slate-600">{p.done}/{p.total}</td>
                    <td className={`px-3 py-3 ${p.overdue ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{p.overdue}</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-2"><ProgressBar value={p.progress} color={p.color} className="w-24" /><span className="text-xs text-slate-600">{p.progress}%</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${card} p-5`}>
          <h2 className="text-base font-semibold text-slate-900">Members</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {a.workload.map((m) => (
              <li key={m.id}>
                <Link to={`/my-tasks?member=${m.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                  <Avatar name={m.name} color={m.avatar_color} size={34} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800">{m.name}</span><span className="block truncate text-xs text-slate-500">{m.job_title}</span></span>
                  <span className="text-xs text-slate-500">{m.assigned_count - m.completed_count} open</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
