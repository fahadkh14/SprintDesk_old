import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { PRIORITY_MAP, PROJECT_STATUS_MAP, STATUS_MAP, initials } from '../utils/format';

export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60';
export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-60';
export const card = 'rounded-2xl border border-slate-200/80 bg-white shadow-card';

export function Avatar({ name, color = '#6938EF', size = 32, className = '' }) {
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ width: size, height: size, background: color, fontSize: Math.max(10, size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}

const pill = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap';

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status];
  return (
    <span className={`${pill} ${s.badge}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY_MAP[priority];
  return <span className={`${pill} ${p.badge}`}>{p.label}</span>;
}

export function ProjectStatusBadge({ status }) {
  const s = PROJECT_STATUS_MAP[status];
  return <span className={`${pill} ${s.badge}`}>{s.label}</span>;
}

export function CategoryTag({ name, color }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {name}
    </span>
  );
}

export function ProgressBar({ value = 0, color = '#6938EF', className = '' }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className={`${card} flex items-start justify-between p-5`}>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {Icon && (
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className={`${card} mx-auto my-8 max-w-lg p-8 text-center`}>
      <AlertTriangle className="mx-auto h-9 w-9 text-rose-500" />
      <h2 className="mt-3 text-base font-semibold text-slate-900">Couldn’t load this data</h2>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {onRetry && <button onClick={onRetry} className={`${btnPrimary} mt-4`}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Inbox className="h-6 w-6" /></span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      {text && <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
