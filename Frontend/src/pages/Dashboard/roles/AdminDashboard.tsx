import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WelcomeCard, KPICard } from '../../../components/Cards/Cards';
import { api } from '../../../services/api';
import { Loader } from '../../../components/Loader/Loader';
import { 
  FiUsers, 
  FiActivity, 
  FiSettings, 
  FiShield, 
  FiLock,
  FiUserPlus
} from 'react-icons/fi';

interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: string | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState({ total: 0, active: 0, adminMode: 0 });
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      // 1. Get users info
      const usersRes = await api.get('/users');
      const allUsers = usersRes.data.data || [];
      const active = allUsers.filter((u: any) => u.is_active).length;
      const adminMode = allUsers.filter((u: any) => u.admin_mode_enabled).length;

      setUserCount({
        total: allUsers.length,
        active,
        adminMode
      });

      // 2. Get activity logs
      const logsRes = await api.get('/users/activity-logs');
      setLogs(logsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching admin dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Admin KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total System Users"
          value={userCount.total.toString()}
          icon={FiUsers}
          change="Registered accounts"
          trend="up"
          color="blue"
        />
        <KPICard
          title="Active Accounts"
          value={userCount.active.toString()}
          icon={FiShield}
          change={`${userCount.total - userCount.active} deactivated`}
          trend="up"
          color="green"
        />
        <KPICard
          title="Delegated Admins"
          value={userCount.adminMode.toString()}
          icon={FiLock}
          change="Fleet Manager Admin Mode"
          trend="up"
          color="purple"
        />
        <KPICard
          title="Audit Trail Logs"
          value={logs.length.toString()}
          icon={FiActivity}
          change="Telemetry items logged"
          trend="up"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Activities Logs (Audit Trail) */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">System Security Audit Trail</h3>
              <p className="text-xs text-slate-400">Security-relevant logging of administrative operations</p>
            </div>
            <FiSettings className="text-slate-400 w-5 h-5" />
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">No activity logs recorded.</div>
            ) : (
              logs.slice(0, 15).map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-start text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-800">{log.user?.name || 'System'}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase">{log.user?.role || 'SYSTEM'}</span>
                    </div>
                    <p className="font-bold text-blue-600">{log.action}</p>
                    {log.details && <p className="text-slate-500">{log.details}</p>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Administration Workflows */}
        <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-800">System Workflows</h3>
              <p className="text-xs text-slate-400">Direct shortcuts to system panels</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/users')}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-2xl text-xs font-bold transition duration-150 cursor-pointer"
              >
                <span>Open User Registry</span>
                <FiUsers className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/users?create=true')}
                className="w-full flex items-center justify-between px-4 py-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-2xl text-xs font-bold transition duration-150 cursor-pointer"
              >
                <span>Register System User</span>
                <FiUserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-450 leading-relaxed">
            <span className="font-bold text-slate-700 block mb-0.5">Admin Security Note</span>
            As an Administrator, you have bypassing permissions to write and read all modules. Activity logging is enabled for all write operations.
          </div>
        </div>
      </div>
    </div>
  );
};
