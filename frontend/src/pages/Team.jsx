import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Avatar, ErrorState, PageHeader, ProgressBar, Spinner, card } from '../components/ui';
import { getTeam } from '../services/api';
import { useAsync } from '../hooks/useAsync';

export default function Team() {
  const { data, error, loading, refetch } = useAsync(getTeam);
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading || !data) return <Spinner />;

  return (
    <>
      <PageHeader title="Team" subtitle={`${data.length} people working across all projects.`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((m) => {
          const pct = m.assigned_count ? Math.round((m.completed_count / m.assigned_count) * 100) : 0;
          return (
            <article key={m.id} className={`${card} flex flex-col p-5`}>
              <div className="flex items-center gap-3">
                <Avatar name={m.name} color={m.avatar_color} size={52} />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{m.name}</h3>
                  <p className="truncate text-sm text-slate-500">{m.job_title}</p>
                </div>
              </div>
              <a href={`mailto:${m.email}`} className="mt-4 flex items-center gap-2 truncate text-sm text-slate-600 hover:text-brand-700">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" /> <span className="truncate">{m.email}</span>
              </a>
              <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                <div><dt className="text-xs text-slate-500">Assigned</dt><dd className="text-lg font-semibold text-slate-900">{m.assigned_count}</dd></div>
                <div><dt className="text-xs text-slate-500">In progress</dt><dd className="text-lg font-semibold text-blue-600">{m.in_progress_count}</dd></div>
                <div><dt className="text-xs text-slate-500">Completed</dt><dd className="text-lg font-semibold text-emerald-600">{m.completed_count}</dd></div>
              </dl>
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={pct} color={m.avatar_color} className="flex-1" />
                <span className="text-xs font-medium text-slate-600">{pct}%</span>
              </div>
              <Link to={`/my-tasks?member=${m.id}`} className="mt-4 rounded-xl border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">View tasks</Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
