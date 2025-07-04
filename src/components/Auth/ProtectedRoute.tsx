import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  fallbackPath = '/login'
}) => {
  const { currentUser, userProfile, hasPermission } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userProfile.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Inactive</h2>
          <p className="text-gray-600 mb-4">Your account has been deactivated. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;