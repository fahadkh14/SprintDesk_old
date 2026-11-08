import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { Avatar, Field, PageHeader, Spinner, btnGhost, card, inputCls } from '../components/ui';
import { getHealth } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useLookups } from '../hooks/useLookups';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';

const VIEWS = [['board', 'Board'], ['list', 'List'], ['timeline', 'Timeline'], ['analytics', 'Analytics']];

export default function Settings() {
  const { team } = useLookups();
  const { settings, update, reset, activeMember } = useSettings();
  const toast = useToast();
  const health = useAsync(getHealth);
  const h = health.data;
  const ok = h?.status === 'ok';

  return (
    <>
      <PageHeader title="Settings" subtitle="Preferences are stored in this browser. SprintDesk has no accounts, so there is nothing to sign in to." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${card} p-6`}>
          <h2 className="text-base font-semibold text-slate-900">Preferences</h2>
          <div className="mt-4 space-y-4">
            <Field label="I am working as">
              <div className="flex items-center gap-3">
                {activeMember && <Avatar name={activeMember.name} color={activeMember.avatar_color} size={36} />}
                <select className={inputCls} value={activeMember?.id ?? ''} onChange={(e) => update({ activeMemberId: Number(e.target.value) })}>
                  {team.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.job_title}</option>)}
                </select>
              </div>
              <span className="mt-1.5 block text-xs text-slate-500">Used for “My tasks” and as the author of your comments.</span>
            </Field>
            <Field label="Default task view">
              <select className={inputCls} value={settings.defaultView} onChange={(e) => update({ defaultView: e.target.value })}>
                {VIEWS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="mt-1.5 block text-xs text-slate-500">Analytics is only available on the Dashboard; other pages fall back to Board.</span>
            </Field>
            <button className={btnGhost} onClick={() => { reset(); toast.success('Preferences reset'); }}>Reset preferences</button>
          </div>
        </section>

        <section className={`${card} p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">System status</h2>
            <button className={btnGhost} onClick={health.refetch} disabled={health.loading}><RefreshCw className={`h-4 w-4 ${health.loading ? 'animate-spin' : ''}`} /> Check again</button>
          </div>
          {health.loading && !h ? <Spinner label="Checking…" /> : health.error ? (
            <p className="mt-4 text-sm text-rose-600">{health.error}</p>
          ) : (
            <>
              <p className={`mt-4 flex items-center gap-2 text-sm font-semibold ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                {ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                {ok ? 'All systems operational' : 'Backend reports a problem'}
              </p>
              <dl className="mt-4 divide-y divide-slate-100 text-sm">
                {[
                  ['Frontend (Nginx)', 'Serving this page'],
                  ['Backend API', ok ? 'Healthy' : `HTTP ${h?.httpStatus}`],
                  ['MySQL database', h?.database === 'up' ? 'Connected' : 'Unreachable'],
                  ['API uptime', h?.uptime_seconds != null ? `${Math.floor(h.uptime_seconds / 60)} min ${h.uptime_seconds % 60} s` : '-'],
                  ['Checked at', h?.timestamp ? new Date(h.timestamp).toLocaleTimeString() : '-'],
                ].map(([k, v]) => <div key={k} className="flex justify-between py-2.5"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-800">{v}</dd></div>)}
              </dl>
            </>
          )}
        </section>
      </div>
    </>
  );
}
