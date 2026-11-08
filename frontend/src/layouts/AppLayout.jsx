import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  BarChart3, CalendarDays, CheckSquare, FolderKanban, LayoutDashboard, LayoutGrid, Menu, Settings, Users, Briefcase, X,
} from 'lucide-react';
import { useLookups } from '../hooks/useLookups';
import { useSettings } from '../hooks/useSettings';
import { Avatar, ErrorState, Spinner } from '../components/ui';

const NAV = [
  { to: '/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/workspace', label: 'Workspace', icon: Briefcase },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true"><path d="M9 21.5c1.6 1.3 3.6 2 6.2 2 3.2 0 5.3-1.4 5.3-3.6 0-4.9-9.6-2.5-9.6-6.4 0-1.7 1.6-2.9 4.3-2.9 1.7 0 3.2.5 4.6 1.4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /></svg>
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">SprintDesk</span>
    </div>
  );
}

export default function AppLayout() {
  const { loading, error, refresh } = useLookups();
  const { activeMember } = useSettings();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:pl-64">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Open navigation" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center justify-between px-2">
          <Brand />
          <button onClick={() => setOpen(false)} aria-label="Close navigation" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Icon className="h-[18px] w-[18px]" /> {label}
            </NavLink>
          ))}
        </nav>
        {activeMember && (
          <Link to="/settings" className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50" title="Change who you are working as">
            <Avatar name={activeMember.name} color={activeMember.avatar_color} size={36} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-800">{activeMember.name}</span>
              <span className="block truncate text-xs text-slate-500">{activeMember.job_title}</span>
            </span>
          </Link>
        )}
      </aside>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {loading ? <Spinner label="Loading SprintDesk…" /> : error ? <ErrorState message={error} onRetry={refresh} /> : <Outlet />}
      </main>
    </div>
  );
}
