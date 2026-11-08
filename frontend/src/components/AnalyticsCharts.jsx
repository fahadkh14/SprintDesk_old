import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { card } from './ui';
import { PRIORITY_MAP, STATUS_MAP } from '../utils/format';

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`${card} p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const axis = { fontSize: 12, fill: '#667085' };
const tip = { contentStyle: { borderRadius: 12, border: '1px solid #e4e7ec', fontSize: 12 }, cursor: { fill: '#f4f3ff' } };
const short = (s, n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function AnalyticsCharts({ analytics: a }) {
  const done = a.by_status.find((s) => s.status === 'done')?.count || 0;
  const statusData = a.by_status.map((s) => ({ name: STATUS_MAP[s.status].label, value: s.count, color: STATUS_MAP[s.status].color }));
  const priorityData = a.by_priority.map((p) => ({ name: PRIORITY_MAP[p.priority].label, count: p.count, color: PRIORITY_MAP[p.priority].color }));
  const workload = a.workload.map((m) => ({ name: m.name.split(' ')[0], Completed: m.completed_count, Open: m.assigned_count - m.completed_count }));
  const categories = a.by_category.map((c) => ({ name: c.name, count: c.task_count, color: c.color }));

  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <ChartCard title="Task completion" subtitle={`${a.total_projects} projects · ${a.total_tasks} tasks`} className="lg:col-span-2">
        <div className="relative h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={[{ v: done }, { v: a.total_tasks - done }]} dataKey="v" innerRadius="68%" outerRadius="90%" startAngle={90} endAngle={-270} stroke="none">
                <Cell fill="#6938EF" /><Cell fill="#EEF0F4" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold text-slate-900">{a.completion_percentage}%</span>
            <span className="text-xs text-slate-500">{done} of {a.total_tasks} done</span>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Tasks by status" className="lg:col-span-2">
        <div className="h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" paddingAngle={2} stroke="none">
                {statusData.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip {...tip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
          {statusData.map((s) => (
            <li key={s.name} className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}</span><b>{s.value}</b></li>
          ))}
        </ul>
      </ChartCard>

      <ChartCard title="Tasks by priority" className="lg:col-span-2">
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={priorityData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
              <Tooltip {...tip} />
              <Bar dataKey="count" name="Tasks" radius={[8, 8, 0, 0]}>{priorityData.map((p) => <Cell key={p.name} fill={p.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Project progress" subtitle="Share of tasks completed" className="lg:col-span-3">
        <div style={{ height: Math.max(220, a.project_progress.length * 48) }}>
          <ResponsiveContainer>
            <BarChart data={a.project_progress} layout="vertical" margin={{ left: 0, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="#eef0f4" />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={axis} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => short(v)} />
              <Tooltip {...tip} formatter={(v) => [`${v}%`, 'Complete']} />
              <Bar dataKey="progress" radius={[0, 8, 8, 0]} barSize={18} background={{ fill: '#f2f4f7', radius: 8 }}>
                {a.project_progress.map((p) => <Cell key={p.id} fill={p.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Team workload" subtitle="Assigned tasks per member" className="lg:col-span-3">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={workload} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
              <Tooltip {...tip} />
              <Bar dataKey="Completed" stackId="w" fill="#12B76A" />
              <Bar dataKey="Open" stackId="w" fill="#9b8afb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Completed</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-400" />Open</span></p>
      </ChartCard>

      <ChartCard title="Tasks by category" className="lg:col-span-6">
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={categories} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
              <Tooltip {...tip} />
              <Bar dataKey="count" name="Tasks" radius={[8, 8, 0, 0]} barSize={36}>{categories.map((c) => <Cell key={c.name} fill={c.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
