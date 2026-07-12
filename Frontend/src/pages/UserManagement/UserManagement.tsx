import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader } from '../../components/Loader/Loader';
import { Modal } from '../../components/Modal/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  FiUserPlus, 
  FiEdit2, 
  FiTrash2, 
  FiKey, 
  FiCheckCircle, 
  FiXCircle,
  FiUser,
  FiSliders,
  FiToggleLeft,
  FiToggleRight
} from 'react-icons/fi';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  admin_mode_enabled: boolean;
  userPermissions: {
    id: number;
    permission_id: number;
    value: boolean;
    permission: {
      name: string;
    };
  }[];
}

interface Permission {
  id: number;
  name: string;
}

interface ActivityLog {
  id: number;
  action: string;
  details: string | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'reminders'>('users');
  const [reminders, setReminders] = useState<any[]>([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [manualReminderModalOpen, setManualReminderModalOpen] = useState(false);
  const [manualRecipient, setManualRecipient] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualBody, setManualBody] = useState('');

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [permModalOpen, setPermModalOpen] = useState(false);
  
  // Forms state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Driver');
  const [newPassword, setNewPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
      
      const permRes = await api.get('/users/available-permissions');
      setAvailablePermissions(permRes.data.data || []);
    } catch (err) {
      console.error('Error fetching users registry:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogLoading(true);
    try {
      const res = await api.get('/users/activity-logs');
      setLogs(res.data.data || []);
    } catch (err) {
      console.error('Error fetching system activity logs:', err);
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchReminders = async () => {
    setReminderLoading(true);
    try {
      const res = await api.get('/reminders');
      setReminders(res.data.data || []);
    } catch (err) {
      console.error('Error fetching reminders logs:', err);
    } finally {
      setReminderLoading(false);
    }
  };

  const handleScanReminders = async () => {
    setReminderLoading(true);
    try {
      const res = await api.post('/reminders/scan', {});
      alert(res.data.message || 'Scan completed successfully.');
      fetchReminders();
    } catch (err: any) {
      alert(err.message || 'Auto scan failed.');
    } finally {
      setReminderLoading(false);
    }
  };

  const handleManualReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await api.post('/reminders/send-manual', {
        recipient: manualRecipient,
        subject: manualSubject,
        body: manualBody
      });
      setFormSuccess('Reminder logged and simulated send completed!');
      setTimeout(() => {
        setManualReminderModalOpen(false);
        setManualRecipient('');
        setManualSubject('');
        setManualBody('');
        fetchReminders();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to dispatch manual alert.');
    } finally {
      setFormSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'reminders') {
      fetchReminders();
    }
  }, [activeTab]);

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (selectedUser) {
        // Update user
        await api.put(`/users/${selectedUser.id}`, { name, email, role });
        setFormSuccess('User details updated successfully!');
      } else {
        // Create user
        await api.post('/users', { name, email, password, role });
        setFormSuccess('User account registered successfully!');
      }

      setTimeout(() => {
        setUserModalOpen(false);
        setSelectedUser(null);
        setName('');
        setEmail('');
        setPassword('');
        setRole('Driver');
        fetchUsers();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving user settings');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await api.post(`/users/${userId}/toggle-status`, {});
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  const handleToggleAdminMode = async (userId: number) => {
    try {
      await api.post(`/users/${userId}/toggle-admin-mode`, {});
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle Admin Mode');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await api.post(`/users/${selectedUser.id}/reset-password`, { password: newPassword });
      setFormSuccess('Security password reset successfully!');
      setTimeout(() => {
        setPassModalOpen(false);
        setSelectedUser(null);
        setNewPassword('');
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to reset password');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTogglePermissionOverride = async (userId: number, permName: string, currentValue: boolean | undefined) => {
    // If undefined, it means no override is set yet. Role defaults are active.
    // Toggling will set override.
    // Let's decide value: if currently granted (value === true), toggle to false.
    // If currently revoked (value === false), delete the override or toggle to undefined.
    // To make it simple, if it's currently true, we set to false. If false/undefined, we set to true.
    let newValue = true;
    if (currentValue === true) {
      newValue = false;
    }

    try {
      await api.post(`/users/${userId}/permissions`, {
        name: permName,
        value: newValue
      });
      // Refresh user permissions list in state
      const refreshedUsers = await api.get('/users');
      setUsers(refreshedUsers.data.data || []);
    } catch (err: any) {
      alert(err.message || 'Failed to update custom permissions override');
    }
  };


  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setFormError(null);
    setFormSuccess(null);
    setUserModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Driver');
    setFormError(null);
    setFormSuccess(null);
    setUserModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Administration console</span>
          <h2 className="text-xl font-extrabold text-slate-800">User & Security Management</h2>
        </div>
        
        {/* Toggle active tab */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            User Registry
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'logs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'reminders' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Email Reminders
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User management panel actions */}
          <div className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className="text-xs font-semibold text-slate-500">
              Manage system permissions, edit credentials, or toggle active accounts.
            </span>
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition duration-150 cursor-pointer"
            >
              <FiUserPlus className="w-4 h-4" />
              <span>Create System User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase bg-slate-50/50">
                    <th className="py-3.5 px-6">User Name</th>
                    <th className="py-3.5 px-6">System Role</th>
                    <th className="py-3.5 px-6">Account Status</th>
                    <th className="py-3.5 px-6">Admin Mode delegation</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        {/* Name and Email */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                              <FiUser className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[8px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* System Role */}
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            u.role === 'Admin' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                            u.role === 'Fleet_Manager' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Status (Active/Inactive) */}
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            disabled={isSelf || (currentUser?.role === 'Fleet_Manager' && u.role === 'Admin')}
                            className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left focus:outline-none"
                          >
                            {u.is_active ? (
                              <>
                                <FiCheckCircle className="text-emerald-500 w-4 h-4" />
                                <span className="font-bold text-slate-700">Active</span>
                              </>
                            ) : (
                              <>
                                <FiXCircle className="text-slate-400 w-4 h-4" />
                                <span className="font-semibold text-slate-400">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Admin Mode (Fleet Manager Only) */}
                        <td className="py-4 px-6">
                          {u.role === 'Fleet_Manager' ? (
                            <button
                              onClick={() => handleToggleAdminMode(u.id)}
                              disabled={currentUser?.role !== 'Admin'}
                              className="flex items-center gap-1.5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed focus:outline-none"
                            >
                              {u.admin_mode_enabled ? (
                                <>
                                  <FiToggleRight className="text-blue-600 w-6 h-6" />
                                  <span className="font-bold text-blue-600 text-[10px]">ENABLED</span>
                                </>
                              ) : (
                                <>
                                  <FiToggleLeft className="text-slate-400 w-6 h-6" />
                                  <span className="font-semibold text-slate-400 text-[10px]">DISABLED</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-[10px]">N/A</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setPermModalOpen(true);
                            }}
                            disabled={currentUser?.role === 'Fleet_Manager' && u.role === 'Admin'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition focus:outline-none cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            title="Edit Permissions Override"
                          >
                            <FiSliders className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewPassword('');
                              setFormError(null);
                              setFormSuccess(null);
                              setPassModalOpen(true);
                            }}
                            disabled={currentUser?.role === 'Fleet_Manager' && u.role === 'Admin'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition focus:outline-none cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            title="Reset User Password"
                          >
                            <FiKey className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(u)}
                            disabled={currentUser?.role === 'Fleet_Manager' && u.role === 'Admin'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition focus:outline-none cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            title="Edit Details"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={isSelf || (currentUser?.role === 'Fleet_Manager' && u.role === 'Admin')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition focus:outline-none cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            title="Delete Account"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Security Audit Logs</h3>
              <p className="text-xs text-slate-400">Database activity tracking</p>
            </div>
            <button
              onClick={fetchLogs}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-650 cursor-pointer"
            >
              Refresh Logs
            </button>
          </div>

          {logLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader />
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">No activity records logged.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-start text-xs hover:bg-slate-100/50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-extrabold text-slate-800">{log.user?.name || 'System'}</span>
                        <span className="text-[8px] bg-slate-200 border border-slate-300 text-slate-600 px-1 py-0.2 rounded font-bold uppercase">{log.user?.role || 'SYSTEM'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({log.user?.email || 'system@transitops.com'})</span>
                      </div>
                      <p className="font-bold text-blue-600 uppercase tracking-wide text-[10px] mt-1">{log.action}</p>
                      {log.details && <p className="text-slate-550 leading-relaxed font-semibold">{log.details}</p>}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className="text-xs font-semibold text-slate-500">
              Review automatically compiled reminder alerts or trigger database checks.
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleScanReminders}
                className="flex items-center justify-center space-x-2 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition duration-150 cursor-pointer"
              >
                <span>Trigger Expiry Check</span>
              </button>
              <button
                onClick={() => {
                  setManualRecipient('');
                  setManualSubject('');
                  setManualBody('');
                  setFormError(null);
                  setFormSuccess(null);
                  setManualReminderModalOpen(true);
                }}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition duration-150 cursor-pointer"
              >
                <span>Send Custom Alert</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            {reminderLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase bg-slate-50/50">
                      <th className="py-3.5 px-6">Sent Date</th>
                      <th className="py-3.5 px-6">Alert Type</th>
                      <th className="py-3.5 px-6">Recipient</th>
                      <th className="py-3.5 px-6">Subject</th>
                      <th className="py-3.5 px-6">Message Body</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">No reminder alerts recorded.</td>
                      </tr>
                    ) : (
                      reminders.map((rem) => (
                        <tr key={rem.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                          <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                            {new Date(rem.sent_at).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-700">
                            {rem.type.replace('_', ' ')}
                          </td>
                          <td className="py-4 px-6 text-slate-650 font-semibold">
                            {rem.recipient}
                          </td>
                          <td className="py-4 px-6 font-extrabold text-blue-600">
                            {rem.subject}
                          </td>
                          <td className="py-4 px-6 text-slate-500 max-w-xs truncate" title={rem.body}>
                            {rem.body}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex px-2 py-0.5 rounded-full font-bold uppercase text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100">
                              {rem.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* USER EDIT/CREATE MODAL */}
      <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title={selectedUser ? 'Edit System Account' : 'Register System Account'}>
        <form onSubmit={handleCreateOrUpdateUser} className="space-y-4">
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
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Name</label>
              <input required placeholder="Amit Sharma" value={name} onChange={e => setName(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email Address</label>
              <input required type="email" placeholder="amit@transitops.com" value={email} onChange={e => setEmail(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>

            {!selectedUser && (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Security Password</label>
                <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assign Core Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option value="Admin">Admin</option>
                <option value="Fleet_Manager">Fleet Manager</option>
                <option value="Driver">Driver</option>
                <option value="Safety_Officer">Safety Officer</option>
                <option value="Financial_Analyst">Financial Analyst</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setUserModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PASSWORD RESET MODAL */}
      <Modal isOpen={passModalOpen} onClose={() => setPassModalOpen(false)} title="Reset Security Credentials">
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
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

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">New Password</label>
            <input required type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
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
              {formSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PERMISSIONS OVERRIDES MODAL */}
      <Modal isOpen={permModalOpen} onClose={() => setPermModalOpen(false)} title={`Permissions Override: ${selectedUser?.name}`}>
        <div className="space-y-4">
          <p className="text-xs text-slate-450 leading-relaxed border-b border-slate-100 pb-2">
            Configure direct permission grants or revocations. An override takes precedence over standard role settings.
          </p>

          <div className="max-h-[350px] overflow-y-auto space-y-2.5 pr-1">
            {availablePermissions.map(perm => {
              // Find if this permission is overridden for selected user
              const override = selectedUser?.userPermissions.find(up => up.permission.name === perm.name);
              const overrideValue = override ? override.value : undefined;

              return (
                <div key={perm.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{perm.name}</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5 uppercase tracking-wide">
                      {overrideValue === true ? 'Directly Granted (Override)' :
                       overrideValue === false ? 'Directly Revoked (Override)' :
                       'Inherited from Role default'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleTogglePermissionOverride(selectedUser!.id, perm.name, overrideValue)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition duration-150 cursor-pointer ${
                        overrideValue === true
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : overrideValue === false
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-200 text-slate-650 hover:bg-slate-300 border-transparent'
                      }`}
                    >
                      {overrideValue === true ? 'GRANTED' : overrideValue === false ? 'REVOKED' : 'INHERITED'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              onClick={() => setPermModalOpen(false)}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* MANUAL REMINDER ALERT MODAL */}
      <Modal isOpen={manualReminderModalOpen} onClose={() => setManualReminderModalOpen(false)} title="Send Custom Email Alert">
        <form onSubmit={handleManualReminderSubmit} className="space-y-4">
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
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recipient Email</label>
              <input required type="email" placeholder="driver@transitops.com" value={manualRecipient} onChange={e => setManualRecipient(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Alert Subject</label>
              <input required placeholder="⚠️ URGENT: Action Required" value={manualSubject} onChange={e => setManualSubject(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Alert Message Body</label>
              <textarea required rows={4} placeholder="Type email message details here..." value={manualBody} onChange={e => setManualBody(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setManualReminderModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {formSubmitting ? 'Sending...' : 'Send Simulated Email'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
