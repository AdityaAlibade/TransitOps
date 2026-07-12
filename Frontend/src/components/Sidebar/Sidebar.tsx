import React from 'react';
import { NavLink } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { useAuth } from '../../context/AuthContext';
import { 
  FiGrid, 
  FiTruck, 
  FiUsers, 
  FiMapPin, 
  FiTool, 
  FiDollarSign, 
  FiBarChart2, 
  FiLogOut,
  FiX
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: IconType;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/', icon: FiGrid },
    { name: 'Vehicles', path: '/vehicles', icon: FiTruck },
    { name: 'Drivers', path: '/drivers', icon: FiUsers },
    { name: 'Trips', path: '/trips', icon: FiMapPin },
    { name: 'Maintenance', path: '/maintenance', icon: FiTool },
    { name: 'Expenses', path: '/expenses', icon: FiDollarSign },
    { name: 'Reports', path: '/reports', icon: FiBarChart2 },
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header / Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              T
            </div>
            <span className="text-lg font-bold tracking-tight text-white">TransitOps</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                // Auto-close on mobile
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                  : 'hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-50/5 rounded-xl transition-all duration-200 text-left"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
