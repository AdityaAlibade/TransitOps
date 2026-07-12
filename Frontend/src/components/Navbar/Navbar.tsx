import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiMenu, 
  FiBell, 
  FiSearch, 
  FiSettings, 
  FiLogOut, 
  FiKey, 
  FiSliders, 
  FiClock, 
  FiTruck, 
  FiUser, 
  FiNavigation, 
  FiLoader
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Modal } from '../Modal/Modal';

interface NavbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, title = 'TransitOps Overview' }) => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Change password modal
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  // API Notifications (Reminders)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dropdown & Search Refs for click-away detection
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const name = user?.name || 'Admin User';
  const role = user?.role || 'Fleet Operations';
  
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const initials = getInitials(name);

  const fetchNavbarReminders = async () => {
    try {
      const res = await api.get('/reminders');
      const data = res.data.data || [];
      setNotifications(data.slice(0, 5)); // Show latest 5
      setUnreadCount(data.length > 0 ? Math.min(data.length, 3) : 0);
    } catch (err) {
      console.error('Error fetching navbar notifications:', err);
    }
  };

  // Sync search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.data);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    fetchNavbarReminders();
    const interval = setInterval(fetchNavbarReminders, 25000);
    return () => clearInterval(interval);
  }, []);

  // Click away listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleAdminMode = async () => {
    if (!user) return;
    try {
      await api.post(`/users/${user.id}/toggle-admin-mode`, {});
      await refreshUser();
      setShowSettings(false);
      alert('Admin Mode updated successfully! Sidemenu permissions synchronized.');
    } catch (err: any) {
      alert(err.message || 'Failed to toggle Admin Mode.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setFormSuccess('Security credentials updated successfully!');
      setTimeout(() => {
        setPassModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Incorrect current password or invalid input.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleClearNotifications = () => {
    setUnreadCount(0);
    setShowNotifications(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/85 shadow-md shadow-slate-950/20">
        
        {/* Left side: Toggler & Page Name */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg lg:hidden transition-colors cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight select-none">
            {title}
          </h1>
        </div>

        {/* Right side: Search, Actions, Profile */}
        <div className="flex items-center space-x-4">
          {/* Active Global Search Bar */}
          <div className="relative hidden md:block" ref={searchRef}>
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
              {searching ? <FiLoader className="w-4 h-4 animate-spin text-blue-500" /> : <FiSearch className="w-4 h-4" />}
            </span>
            <input
              type="text"
              placeholder="Search registry (Vehicles, Drivers, Trips)..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-500 transition"
            />

            {/* Global Search Dropdown Overlay */}
            {showSearchDropdown && searchResults && (
              <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-slate-950/50 py-3 text-xs overflow-hidden z-50">
                <div className="px-4 pb-2 border-b border-slate-800 font-extrabold text-slate-455 uppercase tracking-wider text-[9px]">
                  Global Registry Search Results
                </div>
                <div className="max-h-[320px] overflow-y-auto pr-1">
                  
                  {/* Vehicles Section */}
                  {searchResults.vehicles && searchResults.vehicles.length > 0 && (
                    <div className="p-2 border-b border-slate-850">
                      <p className="px-2 font-extrabold text-blue-400 uppercase text-[8px] tracking-wider mb-1">Vehicles</p>
                      {searchResults.vehicles.map((v: any) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            navigate('/vehicles');
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-slate-300 hover:bg-slate-800 rounded-lg text-left cursor-pointer transition font-medium"
                        >
                          <FiTruck className="w-3.5 h-3.5 text-slate-500" />
                          <div className="truncate">
                            <p className="text-slate-200 font-bold leading-tight">{v.registration_number}</p>
                            <p className="text-[10px] text-slate-500">{v.name_model} ({v.status})</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Drivers Section */}
                  {searchResults.drivers && searchResults.drivers.length > 0 && (
                    <div className="p-2 border-b border-slate-850">
                      <p className="px-2 font-extrabold text-teal-400 uppercase text-[8px] tracking-wider mb-1">Drivers</p>
                      {searchResults.drivers.map((d: any) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            navigate('/drivers');
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-slate-300 hover:bg-slate-800 rounded-lg text-left cursor-pointer transition font-medium"
                        >
                          <FiUser className="w-3.5 h-3.5 text-slate-500" />
                          <div className="truncate">
                            <p className="text-slate-200 font-bold leading-tight">{d.name}</p>
                            <p className="text-[10px] text-slate-500">DL: {d.license_number} ({d.status})</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Trips Section */}
                  {searchResults.trips && searchResults.trips.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 font-extrabold text-amber-400 uppercase text-[8px] tracking-wider mb-1">Trips</p>
                      {searchResults.trips.map((t: any) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            navigate('/trips');
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-slate-300 hover:bg-slate-800 rounded-lg text-left cursor-pointer transition font-medium"
                        >
                          <FiNavigation className="w-3.5 h-3.5 text-slate-500" />
                          <div className="truncate">
                            <p className="text-slate-200 font-bold leading-tight">Trip #{t.id}</p>
                            <p className="text-[10px] text-slate-500">{t.source} ➔ {t.destination}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Empty search matches */}
                  {(!searchResults.vehicles || searchResults.vehicles.length === 0) &&
                   (!searchResults.drivers || searchResults.drivers.length === 0) &&
                   (!searchResults.trips || searchResults.trips.length === 0) && (
                    <div className="text-center py-6 text-slate-500 font-semibold">
                      No matching records found.
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* Notifications Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowSettings(false);
              }}
              className="relative p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800/60 transition duration-150 cursor-pointer"
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-slate-950/50 py-3 text-xs overflow-hidden z-50">
                <div className="flex justify-between items-center px-4 pb-2.5 border-b border-slate-800">
                  <span className="font-extrabold text-slate-350 uppercase tracking-wider">Alert Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleClearNotifications}
                      className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear badge
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-semibold">
                      No alert notifications logged.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-3 border-b border-slate-850 hover:bg-slate-850/50 transition">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-blue-400 uppercase tracking-wide text-[9px]">{notif.type.replace('_', ' ')}</span>
                          <span className="text-[8px] text-slate-500 flex items-center gap-0.5"><FiClock /> {new Date(notif.sent_at).toLocaleDateString()}</span>
                        </div>
                        <p className="font-bold text-slate-200 truncate">{notif.subject}</p>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{notif.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button & Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => {
                setShowSettings(!showSettings);
                setShowNotifications(false);
              }}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800/60 transition duration-150 cursor-pointer"
            >
              <FiSettings className="w-5 h-5" />
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2.5 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-slate-950/50 py-2.5 text-xs z-50">
                
                {/* Profile Header Box */}
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/40">
                  <p className="font-extrabold text-slate-200">{name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{user?.email}</p>
                  <span className="inline-flex mt-1.5 px-2 py-0.2 rounded-full font-bold uppercase text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {role.replace('_', ' ')}
                  </span>
                </div>

                {/* Settings Options List */}
                <div className="p-1.5 space-y-0.5">
                  
                  {/* Admin Mode Toggle for Fleet Manager */}
                  {user?.role === 'Fleet_Manager' && (
                    <button
                      onClick={handleToggleAdminMode}
                      className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer text-left font-bold"
                    >
                      <div className="flex items-center space-x-2">
                        <FiSliders className="w-4 h-4 text-slate-400" />
                        <span>{user.adminMode ? 'Disable Admin Mode' : 'Enable Admin Mode'}</span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${user.adminMode ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                    </button>
                  )}

                  {/* Password reset option */}
                  <button
                    onClick={() => {
                      setPassModalOpen(true);
                      setShowSettings(false);
                      setFormError(null);
                      setFormSuccess(null);
                      setCurrentPassword('');
                      setNewPassword('');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer text-left font-bold"
                  >
                    <FiKey className="w-4 h-4 text-slate-400" />
                    <span>Update Password</span>
                  </button>

                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-800" />

          {/* Profile */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shadow-rose-500/20">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200">{name}</p>
              <p className="text-[10px] text-slate-500 uppercase">{role.replace('_', ' ')}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition duration-150 ml-1 cursor-pointer"
              title="Sign Out"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CHANGE PASSWORD MODAL */}
      <Modal isOpen={passModalOpen} onClose={() => setPassModalOpen(false)} title="Update Security Credentials">
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-500">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-semibold text-emerald-500">
              {formSuccess}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current Password</label>
              <input 
                required 
                type="password" 
                placeholder="••••••••" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" 
              />
            </div>
            
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">New Password</label>
              <input 
                required 
                type="password" 
                placeholder="••••••••" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" 
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setPassModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {formSubmitting ? 'Updating...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
