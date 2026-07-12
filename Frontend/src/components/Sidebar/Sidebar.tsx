import React from 'react';
import { NavLink } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  FiGrid, 
  FiTruck, 
  FiUsers, 
  FiMapPin, 
  FiTool, 
  FiDollarSign, 
  FiBarChart2, 
  FiLogOut,
  FiX,
  FiSettings
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: IconType;
  permission?: string;
  check?: () => boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, hasPermission } = useAuth();
  const { theme } = useTheme();
  
  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/', icon: FiGrid },
    { name: 'Vehicles', path: '/vehicles', icon: FiTruck, permission: 'vehicles:read' },
    { name: 'Drivers', path: '/drivers', icon: FiUsers, permission: 'drivers:read' },
    { name: 'Trips', path: '/trips', icon: FiMapPin, check: () => hasPermission('trips:read') || hasPermission('trips:read:own') },
    { name: 'Maintenance', path: '/maintenance', icon: FiTool, permission: 'maintenance:read' },
    { name: 'Expenses', path: '/expenses', icon: FiDollarSign, permission: 'expenses:read' },
    { name: 'Reports', path: '/reports', icon: FiBarChart2, permission: 'reports:read' },
  ];

  if (hasPermission('users:read')) {
    menuItems.push({ name: 'User Management', path: '/users', icon: FiSettings });
  }

  const filteredMenuItems = menuItems.filter(item => {
    if (item.check) return item.check();
    if (item.permission) return hasPermission(item.permission);
    return true;
  });

  const isDark = theme === 'dark';

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className={`fixed inset-0 z-40 backdrop-blur-sm lg:hidden transition-opacity ${isDark ? 'bg-slate-900/40' : 'bg-slate-600/30'}`}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r
        transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDark 
          ? 'bg-slate-900 text-slate-300 border-slate-800' 
          : 'bg-white text-slate-700 border-slate-200'}
      `}>
        {/* Header / Logo */}
        <div className={`flex items-center justify-between h-16 px-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-rose-500/20">
              T
            </div>
            <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>TransitOps</span>
          </div>
          <button 
            onClick={onClose}
            className={`p-1 rounded-lg lg:hidden ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                  : isDark
                    ? 'hover:bg-slate-800/60 hover:text-white'
                    : 'hover:bg-slate-100 hover:text-slate-900'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'}`}>
          <button
            onClick={logout}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-left
              ${isDark 
                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-50/5' 
                : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50'}`}
          >
            <FiLogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
