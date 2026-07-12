import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WelcomeCard, KPICard } from '../../../components/Cards/Cards';
import { api } from '../../../services/api';
import { Loader } from '../../../components/Loader/Loader';
import { 
  FiTool, 
  FiUsers, 
  FiAlertTriangle, 
  FiTruck,
  FiArrowRight
} from 'react-icons/fi';

interface Vehicle {
  id: number;
  registration_number: string;
  name_model: string;
  status: string;
  odometer_km: string;
}

interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_expiry_date: string;
  status: string;
  safety_score: string;
}

interface MaintenanceLog {
  id: number;
  vehicle_id: number;
  maintenance_type: string;
  description: string | null;
  status: string;
  start_date: string;
  vehicle?: Vehicle;
}

export const SafetyOfficerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);

  const fetchSafetyData = async () => {
    setLoading(true);
    try {
      const vRes = await api.get('/vehicles');
      setVehicles(vRes.data.data || []);

      const dRes = await api.get('/drivers');
      setDrivers(dRes.data.data || []);

      const mRes = await api.get('/maintenance');
      setLogs(mRes.data.data || []);
    } catch (err) {
      console.error('Error loading safety officer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  // Calculations
  const inShop = vehicles.filter(v => v.status === 'In Shop').length;
  const activeMaint = logs.filter(l => l.status === 'Active').length;
  
  const avgSafetyScore = drivers.length > 0 
    ? drivers.reduce((sum, d) => sum + parseFloat(d.safety_score), 0) / drivers.length 
    : 100;

  const today = new Date();
  const warningDate = new Date();
  warningDate.setDate(today.getDate() + 90); // 90 days warning threshold

  const expiringLicenses = drivers.filter(d => {
    const exp = new Date(d.license_expiry_date);
    return exp < warningDate;
  }).length;

  const urgentVehicles = vehicles.filter(v => v.status === 'In Shop' || parseFloat(v.odometer_km) > 100000);
  const licenseWarnings = drivers.filter(d => new Date(d.license_expiry_date) < warningDate);

  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Safety KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Vehicles In Shop"
          value={inShop.toString()}
          icon={FiTruck}
          change="Currently undergoing repair"
          trend="down"
          color="blue"
        />
        <KPICard
          title="Active Maintenance Schedules"
          value={activeMaint.toString()}
          icon={FiTool}
          change="Pending inspections"
          trend="up"
          color="green"
        />
        <KPICard
          title="Average Safety Score"
          value={`${avgSafetyScore.toFixed(1)}%`}
          icon={FiUsers}
          change="Registry average score"
          trend="up"
          color="purple"
        />
        <KPICard
          title="License Exp. Warnings"
          value={expiringLicenses.toString()}
          icon={FiAlertTriangle}
          change="Expiring within 90 days"
          trend="down"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles Requiring Attention */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800">Fleet Service Registry Warnings</h3>
            <button 
              onClick={() => navigate('/maintenance')}
              className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Manage Service Schedules</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Odometer</th>
                </tr>
              </thead>
              <tbody>
                {urgentVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">All vehicles checked. No urgent action required.</td>
                  </tr>
                ) : (
                  urgentVehicles.slice(0, 5).map(v => (
                    <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800">{v.registration_number}</span>
                        <span className="text-[10px] text-slate-400 block">{v.name_model}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                          v.status === 'In Shop' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600">{parseFloat(v.odometer_km).toLocaleString()} km</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* License Expiration Warnings */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800">Expiring Driver Licenses</h3>
            <button 
              onClick={() => navigate('/drivers')}
              className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Manage Drivers</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                  <th className="py-2.5 px-3">Driver Name</th>
                  <th className="py-2.5 px-3">License Number</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {licenseWarnings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">All licenses valid. No expiring warnings.</td>
                  </tr>
                ) : (
                  licenseWarnings.slice(0, 5).map(d => {
                    const expired = new Date(d.license_expiry_date) < today;
                    return (
                      <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800">{d.name}</span>
                          <span className="text-[10px] text-slate-400 block">Safety Score: {d.safety_score}%</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{d.license_number}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[9px] ${
                            expired ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {new Date(d.license_expiry_date).toLocaleDateString()} {expired && '(EXPIRED)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
