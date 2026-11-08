import { AlertTriangle, CheckCircle2, ListChecks, Loader } from 'lucide-react';
import { ErrorState, PageHeader, Spinner, StatCard } from '../components/ui';
import TaskViews from '../components/TaskViews';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { getAnalytics, getStats, getTasks } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useSettings } from '../hooks/useSettings';

export default function Dashboard() {
  const { settings } = useSettings();
  const stats = useAsync(getStats);
  const analytics = useAsync(getAnalytics);
  const tasks = useAsync(() => getTasks());

  const reload = () => { stats.reload(); analytics.reload(); tasks.reload(); };
  const error = stats.error || analytics.error || tasks.error;
  if (error) return <ErrorState message={error} onRetry={() => { stats.refetch(); analytics.refetch(); tasks.refetch(); }} />;
  if (!stats.data || !analytics.data || !tasks.data) return <Spinner />;

  const s = stats.data;
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Track every task across all projects. Drag cards between columns to update their status." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total tasks" value={s.total_tasks} hint={`${s.total_projects} projects · ${s.due_this_week} due this week`} icon={ListChecks} tone="brand" />
        <StatCard label="Overdue tasks" value={s.overdue_tasks} hint={s.overdue_tasks ? 'Past their due date' : 'Nothing is late'} icon={AlertTriangle} tone="rose" />
        <StatCard label="In progress" value={s.in_progress_tasks} hint={`${s.review_tasks} waiting for review`} icon={Loader} tone="blue" />
        <StatCard label="Completed" value={s.completed_tasks} hint={`${s.completion_percentage}% of all tasks`} icon={CheckCircle2} tone="green" />
      </div>
      <TaskViews
        tasks={tasks.data} onChanged={reload} initialView={settings.defaultView}
        analytics={<AnalyticsCharts analytics={analytics.data} />}
      />
    </>
  );
}
