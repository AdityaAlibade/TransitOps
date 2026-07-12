import React from 'react';
import { FiMenu, FiBell, FiSearch, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, title = 'TransitOps Overview' }) => {
  const { user, logout } = useAuth();

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const name = user?.name || 'Admin User';
  const role = user?.role || 'Fleet Operations';
  const initials = getInitials(name);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-100 shadow-sm shadow-slate-100/30">
      
      {/* Left side: Toggler & Page Name */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg lg:hidden transition-colors"
          aria-label="Toggle Sidebar"
        >
          <FiMenu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight select-none">
          {title}
        </h1>
      </div>

      {/* Right side: Search, Actions, Profile */}
      <div className="flex items-center space-x-4">
        {/* Search button placeholder (desktop/tablet) */}
        <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <FiSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Global search..."
            disabled
            className="w-48 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl cursor-not-allowed focus:outline-none"
          />
        </div>

        {/* Notifications */}
        <button 
          disabled
          className="relative p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition duration-150 cursor-not-allowed"
        >
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Settings */}
        <button 
          disabled
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition duration-150 cursor-not-allowed"
        >
          <FiSettings className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Profile */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shadow-blue-500/20">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800">{name}</p>
            <p className="text-[10px] text-slate-400 uppercase">{role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150 ml-1"
            title="Sign Out"
          >
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
