import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { Spinner } from './components/ui';

// Pages are loaded on demand so the first paint stays small (charts are the heavy part).
const Overview = lazy(() => import('./pages/Overview'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const Team = lazy(() => import('./pages/Team'));
const Workspace = lazy(() => import('./pages/Workspace'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/team" element={<Team />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
