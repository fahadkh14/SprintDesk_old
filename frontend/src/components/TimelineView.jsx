import { EmptyState, card } from './ui';
import { STATUS_MAP, addDays, diffDays, fmtDate, parseDate, todayKey } from '../utils/format';

const DAY = 34;
const LABEL_W = 230;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TimelineView({ tasks, onOpen, hideProject }) {
  const dated = tasks.filter((t) => t.start_date || t.due_date);
  if (!dated.length) {
    return <div className={card}><EmptyState title="Nothing to plot" text="Tasks with a start or due date appear on the timeline." /></div>;
  }

  const start = (t) => parseDate(t.start_date || t.due_date);
  const end = (t) => parseDate(t.due_date || t.start_date);
  const today = parseDate(todayKey());
  let min = today; let max = today;
  dated.forEach((t) => { if (start(t) < min) min = start(t); if (end(t) > max) max = end(t); });
  min = addDays(min, -2); max = addDays(max, 3);
  const total = diffDays(min, max) + 1;
  const days = Array.from({ length: total }, (_, i) => addDays(min, i));

  const months = [];
  days.forEach((d) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const last = months[months.length - 1];
    if (last && last.key === key) last.n += 1; else months.push({ key, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, n: 1 });
  });

  const groups = [];
  [...dated].sort((a, b) => start(a) - start(b)).forEach((t) => {
    const gid = hideProject ? 0 : t.project_id;
    let g = groups.find((x) => x.id === gid);
    if (!g) { g = { id: gid, name: hideProject ? null : t.project_name, color: t.project_color, items: [] }; groups.push(g); }
    g.items.push(t);
  });

  const grid = { backgroundImage: 'linear-gradient(to right, #eef0f4 1px, transparent 1px)', backgroundSize: `${DAY}px 100%` };
  const todayLeft = LABEL_W + diffDays(min, today) * DAY + DAY / 2;

  return (
    <div className={`${card} overflow-x-auto`}>
      <div className="relative" style={{ width: LABEL_W + total * DAY }}>
        <div className="flex border-b border-slate-100 bg-slate-50/70">
          <div className="sticky left-0 z-20 shrink-0 border-r border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500" style={{ width: LABEL_W }}>Task</div>
          <div>
            <div className="flex">{months.map((m) => <div key={m.key} className="truncate border-l border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600" style={{ width: m.n * DAY }}>{m.label}</div>)}</div>
            <div className="flex">{days.map((d) => (
              <div key={d.getTime()} className={`py-1 text-center text-[11px] ${d.getDay() === 0 || d.getDay() === 6 ? 'text-slate-300' : 'text-slate-500'} ${diffDays(today, d) === 0 ? 'font-bold text-rose-500' : ''}`} style={{ width: DAY }}>{d.getDate()}</div>
            ))}</div>
          </div>
        </div>

        {groups.map((g) => (
          <div key={g.id}>
            {g.name && (
              <div className="flex border-b border-slate-100 bg-slate-50/60">
                <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700" style={{ width: LABEL_W }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: g.color }} /> {g.name}
                </div>
                <div style={{ width: total * DAY }} />
              </div>
            )}
            {g.items.map((t) => {
              const left = diffDays(min, start(t)) * DAY + 2;
              const width = (diffDays(start(t), end(t)) + 1) * DAY - 4;
              const done = t.status === 'done';
              return (
                <div key={t.id} className="flex h-11 border-b border-slate-100">
                  <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-slate-100 bg-white px-3" style={{ width: LABEL_W }}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_MAP[t.status].color }} title={STATUS_MAP[t.status].label} />
                    <button onClick={() => onOpen(t.id)} className={`truncate text-left text-sm hover:text-brand-700 ${done ? 'text-slate-400 line-through' : 'font-medium text-slate-800'}`}>{t.title}</button>
                  </div>
                  <div className="relative" style={{ width: total * DAY, ...grid }}>
                    <button
                      onClick={() => onOpen(t.id)}
                      title={`${t.title}: ${fmtDate(t.start_date || t.due_date)} to ${fmtDate(t.due_date || t.start_date)}`}
                      className="absolute top-2 flex h-7 items-center overflow-hidden rounded-lg px-2 text-left text-xs font-medium text-white shadow-sm hover:brightness-110"
                      style={{ left, width, background: t.is_overdue ? '#F04438' : t.project_color, opacity: done ? 0.45 : 1 }}
                    >
                      <span className="truncate">{width > 110 ? t.title : ''}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div className="pointer-events-none absolute bottom-0 top-0 z-[5] w-px bg-rose-400" style={{ left: todayLeft }} title="Today" />
      </div>
    </div>
  );
}
