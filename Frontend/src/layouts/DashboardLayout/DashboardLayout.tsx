import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { Navbar } from '../../components/Navbar/Navbar';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Helper to resolve title from pathname
  const getPageTitle = (path: string): string => {
    switch (path) {
      case '/':
        return 'Operations Dashboard';
      case '/vehicles':
        return 'Fleet Inventory';
      case '/drivers':
        return 'Driver Registry';
      case '/trips':
        return 'Trips & Dispatch';
      case '/maintenance':
        return 'Service Schedules';
      case '/expenses':
        return 'Finance & Expenses';
      case '/reports':
        return 'Analytics Reports';
      default:
        return 'TransitOps Control';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Layout */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          title={getPageTitle(location.pathname)}
        />

        {/* Content canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
