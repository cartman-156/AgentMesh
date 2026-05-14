import { Routes, Route, Navigate } from 'react-router-dom';
import PublicRoute from './PublicRoute';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../pages/DashboardPage';
import AgentsPage from '../pages/AgentsPage';
import AgentDetailPage from '../pages/AgentDetailPage';
import RegisterPage from '../pages/RegisterPage';
import SearchPage from '../pages/SearchPage';
import HealthPage from '../pages/HealthPage';
import DebugPage from '../pages/DebugPage';

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
      path="/register"
      element={
        <PublicRoute>
          <RegisterPage />
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
