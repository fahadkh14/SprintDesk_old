import { useSearchParams } from 'react-router-dom';
import { Avatar, ErrorState, PageHeader, Spinner, inputCls } from '../components/ui';
import TaskViews from '../components/TaskViews';
import { getTasks } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useLookups } from '../hooks/useLookups';
import { useSettings } from '../hooks/useSettings';

export default function MyTasks() {
  const { team } = useLookups();
  const { activeMember, settings } = useSettings();
  const [params, setParams] = useSearchParams();

  const member = team.find((m) => String(m.id) === params.get('member')) || activeMember;
  const tasks = useAsync(() => getTasks({ assignee_id: member?.id }), [member?.id]);

  if (!member) return <ErrorState message="No team members found." />;

  const open = tasks.data?.filter((t) => t.status !== 'done') || [];
  const overdue = open.filter((t) => t.is_overdue).length;

  return (
    <>
      <PageHeader
        title={member.id === activeMember?.id ? 'My tasks' : `${member.name.split(' ')[0]}’s tasks`}
        subtitle={tasks.data ? `${open.length} open · ${overdue} overdue · ${tasks.data.length - open.length} completed` : 'Loading tasks…'}
        actions={
          <div className="flex items-center gap-2">
            <Avatar name={member.name} color={member.avatar_color} size={32} />
            <select className={`${inputCls} w-52`} value={member.id} aria-label="Team member"
              onChange={(e) => setParams({ member: e.target.value })}>
              {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        }
      />
      {tasks.error ? <ErrorState message={tasks.error} onRetry={tasks.refetch} />
        : tasks.loading || !tasks.data ? <Spinner />
          : <TaskViews key={member.id} tasks={tasks.data} onChanged={tasks.reload} initialView={settings.defaultView === 'analytics' ? 'board' : settings.defaultView} createDefaults={{ assignee_id: member.id }} hideAssignee />}
    </>
  );
}
