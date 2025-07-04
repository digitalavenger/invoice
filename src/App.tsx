import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import InvoicesPage from './pages/InvoicesPage';
import CustomersPage from './pages/CustomersPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminTenantsPage from './pages/AdminTenantsPage';
import { Permission } from './types';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={
              <ProtectedRoute requiredPermission={Permission.MANAGE_USERS}>
                <Register />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Main Application Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredPermission={Permission.VIEW_DASHBOARD}>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads"
              element={
                <ProtectedRoute requiredPermission={Permission.VIEW_LEADS}>
                  <Layout>
                    <LeadsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute requiredPermission={Permission.VIEW_INVOICES}>
                  <Layout>
                    <InvoicesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute requiredPermission={Permission.VIEW_CUSTOMERS}>
                  <Layout>
                    <CustomersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
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
            
            {/* Admin Routes */}
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;