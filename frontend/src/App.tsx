import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Direct App Layout (Authentication-Free for College Demonstration) */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="find-parking" element={<FindParkingPage />} />
              <Route path="slot-management" element={<SlotManagementPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="reservations/:id" element={<ReservationsPage />} />
              <Route path="parking-lots" element={<ParkingLotsPage />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="entry-exit" element={<EntryExitPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="help" element={<HelpPage />} />

              {/* Administrative Governance Views */}
              <Route path="admin" element={<AdminDashboardPage />} />
              <Route path="admin/users" element={<UserManagementPage />} />
              <Route path="admin/pricing" element={<PricingManagementPage />} />
              <Route path="admin/audit-logs" element={<AuditLogsPage />} />
            </Route>

            {/* Redirect any legacy auth endpoints immediately to main dashboard */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="/signin" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
