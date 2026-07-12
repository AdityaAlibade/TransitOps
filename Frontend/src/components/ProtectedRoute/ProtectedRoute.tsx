import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../Loader/Loader';

export const ProtectedRoute: React.FC = () => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const path = location.pathname;

  // Route-specific permission checks
  if (path.startsWith('/vehicles') && !hasPermission('vehicles:read')) {
    return <Navigate to="/403" replace />;
  }
  if (path.startsWith('/drivers') && !hasPermission('drivers:read')) {
    return <Navigate to="/403" replace />;
  }
  if (path.startsWith('/trips') && !hasPermission('trips:read') && !hasPermission('trips:read:own')) {
    return <Navigate to="/403" replace />;
  }
  if (path.startsWith('/maintenance') && !hasPermission('maintenance:read')) {
    return <Navigate to="/403" replace />;
  }
  if (path.startsWith('/expenses') && !hasPermission('expenses:read')) {
    return <Navigate to="/403" replace />;
  }
  if (path.startsWith('/reports') && !hasPermission('reports:read')) {
    return <Navigate to="/403" replace />;
  }
  if (path.startsWith('/users') && !hasPermission('users:read')) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
