import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import InvoicesPage from './pages/InvoicesPage';
import CustomersPage from './pages/CustomersPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import ClientDashboard from './pages/ClientDashboard';
import LeadsPage from './pages/LeadsPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminTenantsPage from './pages/AdminTenantsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import SubscriptionManagement from './pages/SubscriptionManagement';
import { Permission, UserRole } from './types';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={
              <ProtectedRoute requiredPermission={Permission.MANAGE_USERS}>
                <Register />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard Routes - Different for Super Admin vs Others */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredPermission={Permission.VIEW_DASHBOARD}>
                  <Layout>
                    <DashboardRouter />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Leads Module */}
            <Route
              path="/leads"
              element={
                <ProtectedRoute 
                  requiredPermission={Permission.VIEW_LEADS}
                  requiredModule="leads"
                >
                  <Layout>
                    <LeadsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Invoice Module */}
            <Route
              path="/invoices"
              element={
                <ProtectedRoute 
                  requiredPermission={Permission.VIEW_INVOICES}
                  requiredModule="invoices"
                >
                  <Layout>
                    <InvoicesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute 
                  requiredPermission={Permission.VIEW_CUSTOMERS}
                  requiredModule="invoices"
                >
                  <Layout>
                    <CustomersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Subscription Management */}
            <Route
              path="/subscription"
              element={
                <ProtectedRoute requiredPermission={Permission.MANAGE_TENANT_SETTINGS}>
                  <Layout>
                    <SubscriptionManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Super Admin Routes */}
            <Route
              path="/admin/tenants"
              element={
                <ProtectedRoute requiredPermission={Permission.MANAGE_TENANTS}>
                  <Layout>
                    <AdminTenantsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredPermission={Permission.MANAGE_USERS}>
                  <Layout>
                    <AdminUsersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Component to route to appropriate dashboard based on user role
const DashboardRouter: React.FC = () => {
  const { userProfile } = useAuth();
  
  if (userProfile?.role === UserRole.SUPER_ADMIN) {
    return <SuperAdminDashboard />;
  }
  
  if (userProfile?.role === UserRole.CLIENT || userProfile?.role === UserRole.CLIENT_USER) {
    return <ClientDashboard />;
  }
  
  return <DashboardPage />;
};

export default App;