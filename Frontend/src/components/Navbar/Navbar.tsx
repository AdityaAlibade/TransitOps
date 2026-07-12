import React from 'react';
import { FiMenu, FiBell, FiSearch, FiSettings, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, title = 'TransitOps Overview' }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

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
    <header className={`
      sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b shadow-md transition-colors duration-300
      ${isDark 
        ? 'bg-slate-900/60 backdrop-blur-md border-slate-800/85 shadow-slate-950/20 text-slate-100' 
        : 'bg-white/80 backdrop-blur-md border-slate-200 shadow-slate-200/40 text-slate-900'}
    `}>
      
      {/* Left side: Toggler & Page Name */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-lg lg:hidden transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          aria-label="Toggle Sidebar"
        >
          <FiMenu className="w-6 h-6" />
        </button>
        <h1 className={`text-lg font-bold tracking-tight select-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          {title}
        </h1>
      </div>

      {/* Right side: Search, Actions, Profile */}
      <div className="flex items-center space-x-4">
        {/* Search button placeholder (desktop/tablet) */}
        <div className="relative hidden md:block">
          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <FiSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Global search..."
            disabled
            className={`w-48 pl-9 pr-3 py-1.5 text-xs border rounded-xl cursor-not-allowed focus:outline-none
              ${isDark 
                ? 'bg-slate-950/80 border-slate-800 text-slate-300 placeholder-slate-500' 
                : 'bg-slate-100 border-slate-200 text-slate-500 placeholder-slate-400'}`}
          />
        </div>

        {/* Notifications */}
        <button 
          disabled
          className={`relative p-2 rounded-xl transition duration-150 cursor-not-allowed ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-slate-900"></span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          id="theme-toggle-btn"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`p-2 rounded-xl transition duration-150 ${isDark ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/60' : 'text-slate-500 hover:text-rose-500 hover:bg-slate-100'}`}
        >
          {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </button>

        {/* Settings */}
        <button 
          disabled
          className={`p-2 rounded-xl transition duration-150 cursor-not-allowed ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
        >
          <FiSettings className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className={`w-px h-6 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Profile */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shadow-rose-500/20">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{name}</p>
            <p className={`text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={logout}
            className={`p-1.5 rounded-xl transition duration-150 ml-1 ${isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50'}`}
            title="Sign Out"
          >
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
