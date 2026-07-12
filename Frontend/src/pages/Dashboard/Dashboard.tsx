import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './roles/AdminDashboard';
import { FleetManagerDashboard } from './roles/FleetManagerDashboard';
import { DriverDashboard } from './roles/DriverDashboard';
import { SafetyOfficerDashboard } from './roles/SafetyOfficerDashboard';
import { FinancialAnalystDashboard } from './roles/FinancialAnalystDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'Admin':
      return <AdminDashboard />;
    case 'Fleet_Manager':
      return <FleetManagerDashboard />;
    case 'Driver':
      return <DriverDashboard />;
    case 'Safety_Officer':
      return <SafetyOfficerDashboard />;
    case 'Financial_Analyst':
      return <FinancialAnalystDashboard />;
    default:
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white border border-slate-100 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Invalid Role Configured</h2>
          <p className="text-sm text-slate-500 mt-1">Please verify your user settings or contact your system administrator.</p>
        </div>
      );
  }
};
