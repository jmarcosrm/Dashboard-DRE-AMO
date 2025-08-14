import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard, Analytics, Reports, Admin, Settings } from './pages';
import { AuthPage } from './pages/auth';
import DataEditor from './pages/data-editor';
import IntegrationSettings from './pages/IntegrationSettings';
import MonitoringDashboard from './pages/MonitoringDashboard';
import DataMappings from './pages/DataMappings';
import { AuthProvider } from './contexts/auth-context';
import { NotificationProvider } from './contexts/notification-context';
import { ProtectedRoute } from './components/auth/protected-route';
import { useUIStore } from './store';

const App: React.FC = () => {
  const { theme } = useUIStore();
  
  // Apply theme to document
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Routes>
            {/* Authentication Route */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Main Layout Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
            {/* Dashboard */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Analytics Routes */}
            <Route path="analytics" element={<Analytics />} />
            <Route path="analytics/dre" element={<Analytics />} />
            <Route path="analytics/comparisons" element={<Analytics />} />
            <Route path="analytics/trends" element={<Analytics />} />
            
            {/* Reports Routes */}
            <Route path="reports" element={<Reports />} />
            <Route path="reports/financial" element={<Reports />} />
            <Route path="reports/custom" element={<Reports />} />
            
            {/* Administration Routes - Admin only */}
            <Route path="admin" element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="admin/entities" element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="admin/accounts" element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            } />
            
            {/* Data Editor */}
            <Route path="data-editor" element={<DataEditor />} />
            
            {/* Integration Management */}
            <Route path="integrations" element={<IntegrationSettings />} />
            <Route path="integrations/settings" element={<IntegrationSettings />} />
            
            {/* Monitoring */}
            <Route path="monitoring" element={<MonitoringDashboard />} />
            <Route path="monitoring/dashboard" element={<MonitoringDashboard />} />
            
            {/* Data Mappings */}
            <Route path="data-mappings" element={<DataMappings />} />
            <Route path="data-mappings/configure" element={<DataMappings />} />
            
            {/* Settings */}
            <Route path="settings" element={<Settings />} />
            <Route path="settings/profile" element={<Settings />} />
            <Route path="settings/notifications" element={<Settings />} />
            <Route path="settings/appearance" element={<Settings />} />
            <Route path="settings/security" element={<Settings />} />
            <Route path="settings/system" element={<Settings />} />
          </Route>
          
            {/* Redirect any unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;