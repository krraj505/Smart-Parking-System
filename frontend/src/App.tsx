import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

import { DashboardPage } from './pages/DashboardPage';
import { FindParkingPage } from './pages/FindParkingPage';
import { SlotManagementPage } from './pages/SlotManagementPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { EntryExitPage } from './pages/EntryExitPage';
import { ParkingLotsPage } from './pages/ParkingLotsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { PricingManagementPage } from './pages/admin/PricingManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: string[] }> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="w-8 h-8 border-4 border-electric-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Main Application Layout Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="find-parking" element={<FindParkingPage />} />
              <Route path="slot-management" element={<SlotManagementPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="reservations/:id" element={<ReservationsPage />} />
              <Route path="parking-lots" element={<ParkingLotsPage />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route
                path="entry-exit"
                element={
                  <ProtectedRoute requiredRoles={['operator', 'admin']}>
                    <EntryExitPage />
                  </ProtectedRoute>
                }
              />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="help" element={<HelpPage />} />

              {/* Administrator Dedicated Routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/pricing"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <PricingManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
