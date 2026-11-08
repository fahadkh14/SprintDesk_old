import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FolderKanban, ListChecks } from 'lucide-react';
import { Avatar, ErrorState, PageHeader, ProgressBar, ProjectStatusBadge, Spinner, StatCard, btnGhost, card } from '../components/ui';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { PRIORITY_MAP, STATUS_MAP, downloadCsv, todayKey } from '../utils/format';
import { errMsg, getAnalytics, getStats, getTasks } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../hooks/useToast';

export default function Reports() {
  const toast = useToast();
  const stats = useAsync(getStats);
  const analytics = useAsync(getAnalytics);
  const [exporting, setExporting] = useState(false);

  const error = stats.error || analytics.error;
  if (error) return <ErrorState message={error} onRetry={() => { stats.refetch(); analytics.refetch(); }} />;
  if (!stats.data || !analytics.data) return <Spinner />;
  const s = stats.data;
  const a = analytics.data;

  async function exportCsv() {
    setExporting(true);
    try {
      const tasks = await getTasks();
      downloadCsv(`sprintdesk-tasks-${todayKey()}.csv`, [
        ['ID', 'Title', 'Project', 'Category', 'Assignee', 'Status', 'Priority', 'Start date', 'Due date', 'Overdue', 'Subtasks done', 'Subtasks total'],
        ...tasks.map((t) => [t.id, t.title, t.project_name, t.category_name, t.assignee_name, STATUS_MAP[t.status].label, PRIORITY_MAP[t.priority].label, t.start_date, t.due_date, t.is_overdue ? 'Yes' : 'No', t.subtask_done, t.subtask_total]),
      ]);
      toast.success(`Exported ${tasks.length} tasks`);
    } catch (e) { toast.error(errMsg(e)); } finally { setExporting(false); }
  }

  return (
    <>
      <PageHeader
        title="Reports" subtitle="Project and task statistics, straight from the database."
        actions={<button className={btnGhost} onClick={exportCsv} disabled={exporting}><Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Export tasks (CSV)'}</button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={s.total_projects} icon={FolderKanban} tone="brand" />
        <StatCard label="Total tasks" value={s.total_tasks} hint={`${s.todo_tasks} to do · ${s.review_tasks} in review`} icon={ListChecks} tone="blue" />
        <StatCard label="Completion rate" value={`${s.completion_percentage}%`} hint={`${s.completed_tasks} tasks completed`} icon={CheckCircle2} tone="green" />
        <StatCard label="Overdue" value={s.overdue_tasks} hint={`${s.due_this_week} due in the next 7 days`} icon={AlertTriangle} tone="rose" />
      </div>

      <AnalyticsCharts analytics={a} />

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className={`${card} overflow-hidden`}>
          <h2 className="px-5 pt-5 text-base font-semibold text-slate-900">Project summary</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50/70 text-left text-xs font-semibold text-slate-500">
                <tr><th className="px-5 py-3">Project</th><th className="px-2 py-3">Tasks</th><th className="px-2 py-3">Active</th><th className="px-2 py-3">Overdue</th><th className="px-5 py-3">Done</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {a.project_progress.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3"><span className="flex items-center gap-2 font-medium text-slate-900"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.name}</span><span className="mt-1 block"><ProjectStatusBadge status={p.status} /></span></td>
                    <td className="px-2 py-3 text-slate-600">{p.total}</td>
                    <td className="px-2 py-3 text-slate-600">{p.in_progress}</td>
                    <td className={`px-2 py-3 ${p.overdue ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{p.overdue}</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-2"><ProgressBar value={p.progress} color={p.color} className="w-20" /><span className="text-xs text-slate-600">{p.progress}%</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${card} overflow-hidden`}>
          <h2 className="px-5 pt-5 text-base font-semibold text-slate-900">Team summary</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-slate-50/70 text-left text-xs font-semibold text-slate-500">
                <tr><th className="px-5 py-3">Member</th><th className="px-2 py-3">Assigned</th><th className="px-2 py-3">In progress</th><th className="px-2 py-3">Completed</th><th className="px-5 py-3">Overdue</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {a.workload.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3"><span className="flex items-center gap-2.5 font-medium text-slate-900"><Avatar name={m.name} color={m.avatar_color} size={28} />{m.name}</span></td>
                    <td className="px-2 py-3 text-slate-600">{m.assigned_count}</td>
                    <td className="px-2 py-3 text-slate-600">{m.in_progress_count}</td>
                    <td className="px-2 py-3 text-slate-600">{m.completed_count}</td>
                    <td className={`px-5 py-3 ${m.overdue_count ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{m.overdue_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
