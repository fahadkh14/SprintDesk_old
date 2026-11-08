import { useState } from 'react';
import { CalendarDays, MessageSquare, Plus, CheckSquare } from 'lucide-react';
import { Avatar, CategoryTag, EmptyState, PriorityBadge } from './ui';
import { STATUSES, dueLabel } from '../utils/format';

function TaskCard({ task, dragging, onOpen, onMove, onDragStart, onDragEnd, hideProject }) {
  const overdue = task.is_overdue;
  return (
    <article
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      onClick={() => onOpen(task)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(task)}
      className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3.5 shadow-card transition hover:border-brand-300 hover:shadow-md active:cursor-grabbing ${dragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <CategoryTag name={task.category_name} color={task.category_color} />
      </div>
      <h4 className="mt-2.5 text-sm font-semibold leading-snug text-slate-900">{task.title}</h4>
      {!hideProject && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ background: task.project_color }} /> {task.project_name}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 ${overdue ? 'font-semibold text-rose-600' : ''}`}>
            <CalendarDays className="h-3.5 w-3.5" /> {dueLabel(task)}
          </span>
          {task.subtask_total > 0 && (
            <span className="flex items-center gap-1" title="Subtasks done"><CheckSquare className="h-3.5 w-3.5" />{task.subtask_done}/{task.subtask_total}</span>
          )}
          {task.comment_count > 0 && (
            <span className="flex items-center gap-1" title="Comments"><MessageSquare className="h-3.5 w-3.5" />{task.comment_count}</span>
          )}
        </div>
        {task.assignee_name
          ? <Avatar name={task.assignee_name} color={task.assignee_color} size={26} />
          : <span className="text-slate-400">Unassigned</span>}
      </div>
      <select
        className="touch-only mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
        value={task.status} aria-label={`Move ${task.title}`}
        onClick={(e) => e.stopPropagation()} onChange={(e) => onMove(task.id, e.target.value)}
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>Move to: {s.label}</option>)}
      </select>
    </article>
  );
}

export default function KanbanBoard({ tasks, onOpen, onMove, onAdd, hideProject }) {
  const [over, setOver] = useState(null);
  const [dragId, setDragId] = useState(null);

  const drop = (e, status) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain')) || dragId;
    setOver(null); setDragId(null);
    const t = tasks.find((x) => x.id === id);
    if (t && t.status !== status) onMove(id, status);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STATUSES.map((col) => {
        const items = tasks.filter((t) => t.status === col.value);
        return (
          <section
            key={col.value} aria-label={col.label}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== col.value) setOver(col.value); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
            onDrop={(e) => drop(e, col.value)}
            className={`flex min-h-[200px] flex-col rounded-2xl border p-3 transition-colors ${over === col.value ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200/80 bg-slate-100/60'}`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                {col.label}
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{items.length}</span>
              </h3>
              <button onClick={() => onAdd(col.value)} aria-label={`Add task to ${col.label}`} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-brand-600">
                <Plus className="h-4 w-4" />
              </button>
            </header>
            <div className="flex flex-1 flex-col gap-3">
              {items.map((t) => (
                <TaskCard
                  key={t.id} task={t} dragging={dragId === t.id} hideProject={hideProject}
                  onOpen={(x) => onOpen(x.id)} onMove={onMove}
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(t.id)); e.dataTransfer.effectAllowed = 'move'; setDragId(t.id); }}
                  onDragEnd={() => { setDragId(null); setOver(null); }}
                />
              ))}
              {items.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">Drop a task here</p>}
            </div>
          </section>
        );
      })}
      {tasks.length === 0 && <div className="md:col-span-2 xl:col-span-4"><EmptyState title="No tasks match" text="Try clearing the filters or create a new task." /></div>}
    </div>
  );
}
