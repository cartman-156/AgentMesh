import { Navigate, Route, Routes } from 'react-router-dom';
import AgentDetailPage from '../pages/AgentDetailPage';
import AgentsPage from '../pages/AgentsPage';
import DashboardPage from '../pages/DashboardPage';
import DebugPage from '../pages/DebugPage';
import HealthPage from '../pages/HealthPage';
import SearchPage from '../pages/SearchPage';
import PublicRoute from './PublicRoute';

const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <PublicRoute>
          <DashboardPage />
        </PublicRoute>
      }
    />
    <Route
      path="/agents"
      element={
        <PublicRoute>
          <AgentsPage />
        </PublicRoute>
      }
    />
    <Route
      path="/agents/:id"
      element={
        <PublicRoute>
          <AgentDetailPage />
        </PublicRoute>
      }
    />
    <Route
      path="/search"
      element={
        <PublicRoute>
          <SearchPage />
        </PublicRoute>
      }
    />
    <Route
      path="/health"
      element={
        <PublicRoute>
          <HealthPage />
        </PublicRoute>
      }
    />
    <Route
      path="/debug"
      element={
        <PublicRoute>
          <DebugPage />
        </PublicRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
