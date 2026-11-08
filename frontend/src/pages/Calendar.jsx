import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { EmptyState, ErrorState, PageHeader, PriorityBadge, Spinner, StatusBadge, btnGhost, btnPrimary, card } from '../components/ui';
import TaskModal from '../components/TaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { addDays, fmtDate, toKey, todayKey } from '../utils/format';
import { deleteTask, errMsg, getTasks } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../hooks/useToast';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Calendar() {
  const toast = useToast();
  const { data, error, loading, refetch, reload } = useAsync(() => getTasks());
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(todayKey());
  const [modal, setModal] = useState({ open: false, taskId: null, defaults: {} });
  const [toDelete, setToDelete] = useState(null);

  const byDate = useMemo(() => {
    const m = {};
    (data || []).forEach((t) => { if (t.due_date) (m[t.due_date] ||= []).push(t); });
    return m;
  }, [data]);

  const cells = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const total = Math.ceil((offset + days) / 7) * 7;
    return Array.from({ length: total }, (_, i) => addDays(first, i - offset));
  }, [cursor]);

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading || !data) return <Spinner />;

  const today = todayKey();
  const monthLabel = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const dayTasks = byDate[selected] || [];
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  async function confirmDelete() {
    try {
      await deleteTask(toDelete.id);
      toast.success('Task deleted');
      setToDelete(null); closeModal(); reload();
    } catch (e) { toast.error(errMsg(e)); }
  }

  return (
    <>
      <PageHeader
        title="Calendar" subtitle="Tasks are placed on their due dates."
        actions={<>
          <button className={btnGhost} onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(todayKey()); }}>Today</button>
          <button className={btnGhost} onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
          <button className={btnGhost} onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
        </>}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <section className={`${card} p-4 xl:col-span-2`}>
          <h2 className="mb-3 px-1 text-lg font-semibold text-slate-900">{monthLabel}</h2>
          <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center text-xs font-semibold text-slate-500">
            {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-100">
            {cells.map((d) => {
              const key = toKey(d);
              const items = byDate[key] || [];
              const inMonth = d.getMonth() === cursor.getMonth();
              return (
                <button
                  key={key} onClick={() => setSelected(key)} aria-label={`${fmtDate(key)}, ${items.length} tasks`}
                  className={`flex min-h-[64px] flex-col items-stretch bg-white p-1.5 text-left transition-colors hover:bg-brand-50/50 sm:min-h-[96px] ${selected === key ? 'ring-2 ring-inset ring-brand-500' : ''} ${inMonth ? '' : 'bg-slate-50/80'}`}
                >
                  <span className={`mb-1 flex h-6 w-6 items-center justify-center self-start rounded-full text-xs font-medium ${key === today ? 'bg-brand-600 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300'}`}>{d.getDate()}</span>
                  <div className="hidden space-y-1 sm:block">
                    {items.slice(0, 2).map((t) => (
                      <span key={t.id} className="block truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white" style={{ background: t.is_overdue ? '#F04438' : t.project_color, opacity: t.status === 'done' ? 0.5 : 1 }}>{t.title}</span>
                    ))}
                    {items.length > 2 && <span className="block px-1 text-[11px] font-medium text-slate-500">+{items.length - 2} more</span>}
                  </div>
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {items.slice(0, 4).map((t) => <span key={t.id} className="h-1.5 w-1.5 rounded-full" style={{ background: t.project_color }} />)}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className={`${card} p-5`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{fmtDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
              <p className="text-sm text-slate-500">{dayTasks.length === 1 ? '1 task due' : `${dayTasks.length} tasks due`}</p>
            </div>
            <button className={btnPrimary} onClick={() => setModal({ open: true, taskId: null, defaults: { due_date: selected } })}><Plus className="h-4 w-4" /> Add</button>
          </div>
          {dayTasks.length === 0 ? <EmptyState title="Nothing due" text="Pick another day or add a task for this date." /> : (
            <ul className="mt-4 space-y-3">
              {dayTasks.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setModal({ open: true, taskId: t.id, defaults: {} })} className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-brand-300">
                    <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full" style={{ background: t.project_color }} />{t.project_name}{t.assignee_name && ` · ${t.assignee_name}`}</p>
                    <div className="mt-2 flex gap-2"><StatusBadge status={t.status} /><PriorityBadge priority={t.priority} /></div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Overdue</li>
            <li>Bar colour shows the project</li>
          </ul>
        </section>
      </div>

      <TaskModal open={modal.open} taskId={modal.taskId} defaults={modal.defaults} onClose={closeModal} onChanged={reload} onDelete={setToDelete} />
      <ConfirmDialog
        open={Boolean(toDelete)} title="Delete this task?" onClose={() => setToDelete(null)} onConfirm={confirmDelete}
        message={`“${toDelete?.title}” and its subtasks and comments will be permanently deleted.`}
      />
    </>
  );
}
