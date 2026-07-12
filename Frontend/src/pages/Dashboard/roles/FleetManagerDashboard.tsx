import React, { useState, useEffect } from 'react';
import { WelcomeCard, KPICard } from '../../../components/Cards/Cards';
import { TripPerformanceChart, OperatingExpensesChart } from '../../../components/Charts/Charts';
import { Modal } from '../../../components/Modal/Modal';
import { api } from '../../../services/api';
import { Loader } from '../../../components/Loader/Loader';
import { 
  FiTruck, 
  FiMapPin, 
  FiUsers, 
  FiTool, 
  FiPlus,
  FiActivity
} from 'react-icons/fi';

interface KpiData {
  totalVehicles: number;
  availableVehicles: number;
  vehiclesOnTrip: number;
  vehiclesInShop: number;
  activeTrips: number;
  pendingTrips: number;
  completedTrips: number;
  totalDrivers: number;
  driversOnDuty: number;
  availableDrivers: number;
  fleetUtilization: number;
  expiringLicenses: number;
}

interface ActivityEvent {
  id: string;
  type: 'trip' | 'maintenance' | 'expense';
  title: string;
  description: string;
  time: string;
}

export const FleetManagerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [tripChartData, setTripChartData] = useState<any[]>([]);
  const [expenseChartData, setExpenseChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  
  // Form values state
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Dropdown options
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  // Form Fields
  // Vehicle
  const [regNum, setRegNum] = useState('');
  const [modelName, setModelName] = useState('');
  const [vType, setVType] = useState('Truck');
  const [maxLoad, setMaxLoad] = useState('');
  const [acqCost, setAcqCost] = useState('');
  const [region, setRegion] = useState('West');

  // Driver
  const [driverName, setDriverName] = useState('');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseCat, setLicenseCat] = useState('Heavy Transport');
  const [licenseExp, setLicenseExp] = useState('');
  const [contactNum, setContactNum] = useState('');

  // Trip
  const [tripSource, setTripSource] = useState('');
  const [tripDest, setTripDest] = useState('');
  const [tripVehId, setTripVehId] = useState('');
  const [tripDrvId, setTripDrvId] = useState('');
  const [tripCargo, setTripCargo] = useState('');
  const [tripDist, setTripDist] = useState('');

  // Maintenance
  const [maintVehId, setMaintVehId] = useState('');
  const [maintType, setMaintType] = useState('Oil Change');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintStart, setMaintStart] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const kpisRes = await api.get('/dashboard/kpis');
      setKpis(kpisRes.data.data);

      const tripsRes = await api.get('/trips');
      const allTrips = tripsRes.data.data || [];

      const expensesRes = await api.get('/expenses');
      const allExpenses = expensesRes.data.data || [];

      // Process Trip Chart Data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const tripAgg: Record<string, { Dispatched: number; Completed: number }> = {};
      months.forEach(m => {
        tripAgg[m] = { Dispatched: 0, Completed: 0 };
      });

      allTrips.forEach((t: any) => {
        const d = new Date(t.created_at);
        if (!isNaN(d.getTime())) {
          const monthName = months[d.getMonth()];
          if (t.status === 'Dispatched') {
            tripAgg[monthName].Dispatched += 1;
          } else if (t.status === 'Completed') {
            tripAgg[monthName].Completed += 1;
          }
        }
      });

      const formattedTripChart = months.map(m => ({
        name: m,
        Dispatched: tripAgg[m].Dispatched,
        Completed: tripAgg[m].Completed
      }));
      setTripChartData(formattedTripChart);

      // Process Expense Chart Data
      const expenseAgg: Record<string, { Fuel: number; Maintenance: number; Toll: number; Other: number }> = {};
      months.forEach(m => {
        expenseAgg[m] = { Fuel: 0, Maintenance: 0, Toll: 0, Other: 0 };
      });

      allExpenses.forEach((exp: any) => {
        const d = new Date(exp.expense_date);
        if (!isNaN(d.getTime())) {
          const monthName = months[d.getMonth()];
          const type = exp.expense_type as 'Fuel' | 'Maintenance' | 'Toll' | 'Other';
          if (expenseAgg[monthName] && type in expenseAgg[monthName]) {
            expenseAgg[monthName][type] += Number(exp.amount);
          }
        }
      });

      const formattedExpenseChart = months.map(m => ({
        name: m,
        Fuel: expenseAgg[m].Fuel,
        Maintenance: expenseAgg[m].Maintenance,
        Toll: expenseAgg[m].Toll,
        Other: expenseAgg[m].Other
      }));
      setExpenseChartData(formattedExpenseChart);

      // Recent activities
      const feed: ActivityEvent[] = [];
      allTrips.slice(0, 3).forEach((t: any) => {
        feed.push({
          id: `trip-${t.id}`,
          type: 'trip',
          title: `Trip ${t.status}`,
          description: `${t.source} to ${t.destination} - Cargo: ${t.cargo_weight_kg}kg`,
          time: new Date(t.created_at).toLocaleString()
        });
      });

      allExpenses.slice(0, 2).forEach((exp: any) => {
        feed.push({
          id: `expense-${exp.id}`,
          type: 'expense',
          title: `Expense logged (${exp.expense_type})`,
          description: `Logged ₹${exp.amount} for ${exp.description || 'miscellaneous expense'}`,
          time: new Date(exp.expense_date).toLocaleDateString()
        });
      });

      setActivities(feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const loadDropdownOptions = async () => {
    try {
      const vRes = await api.get('/vehicles');
      setVehicles((vRes.data.data || []).filter((v: any) => v.status === 'Available'));
      
      const dRes = await api.get('/drivers');
      setDrivers((dRes.data.data || []).filter((d: any) => d.status === 'Available'));
    } catch (err) {
      console.error('Error loading dropdown lists:', err);
    }
  };

  const openQuickActionModal = async (action: string) => {
    setModalTitle(action);
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);

    if (action === 'Dispatch Trip' || action === 'Schedule Maintenance') {
      await loadDropdownOptions();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (modalTitle === 'Register Vehicle') {
        await api.post('/vehicles', {
          registration_number: regNum,
          name_model: modelName,
          type: vType,
          max_load_capacity_kg: parseFloat(maxLoad),
          acquisition_cost: parseFloat(acqCost),
          region
        });
        setRegNum('');
        setModelName('');
        setMaxLoad('');
        setAcqCost('');
      } else if (modalTitle === 'Register Driver') {
        await api.post('/drivers', {
          name: driverName,
          license_number: licenseNum,
          license_category: licenseCat,
          license_expiry_date: new Date(licenseExp).toISOString(),
          contact_number: contactNum
        });
        setDriverName('');
        setLicenseNum('');
        setLicenseExp('');
        setContactNum('');
      } else if (modalTitle === 'Dispatch Trip') {
        await api.post('/trips', {
          source: tripSource,
          destination: tripDest,
          vehicle_id: parseInt(tripVehId, 10),
          driver_id: parseInt(tripDrvId, 10),
          cargo_weight_kg: parseFloat(tripCargo),
          planned_distance_km: parseFloat(tripDist)
        });
        setTripSource('');
        setTripDest('');
        setTripVehId('');
        setTripDrvId('');
        setTripCargo('');
        setTripDist('');
      } else if (modalTitle === 'Schedule Maintenance') {
        await api.post('/maintenance', {
          vehicle_id: parseInt(maintVehId, 10),
          maintenance_type: maintType,
          description: maintDesc,
          cost: parseFloat(maintCost) || 0,
          start_date: new Date(maintStart).toISOString()
        });
        setMaintVehId('');
        setMaintDesc('');
        setMaintCost('');
        setMaintStart('');
      }

      setFormSuccess('Operation completed successfully!');
      setTimeout(() => {
        setModalOpen(false);
        fetchDashboardData();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving');
    } finally {
      setFormSubmitting(false);
    }
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
      <WelcomeCard />

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Vehicles"
          value={kpis?.totalVehicles.toString() || '0'}
          icon={FiTruck}
          change={`${kpis?.fleetUtilization || 0}% utilization`}
          trend="up"
          color="blue"
        />
        <KPICard
          title="Active Trips"
          value={kpis?.activeTrips.toString() || '0'}
          icon={FiMapPin}
          change={`${kpis?.pendingTrips || 0} pending dispatch`}
          trend="up"
          color="green"
        />
        <KPICard
          title="Drivers Active"
          value={kpis?.totalDrivers.toString() || '0'}
          icon={FiUsers}
          change={`${kpis?.driversOnDuty || 0} currently on trip`}
          trend="up"
          color="purple"
        />
        <KPICard
          title="Maintenance Due"
          value={kpis?.vehiclesInShop.toString() || '0'}
          icon={FiTool}
          change={`${kpis?.expiringLicenses || 0} license warnings`}
          trend="down"
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TripPerformanceChart 
          data={tripChartData} 
          title="Trip Performance Overview" 
          description="Monitors successful completions and active dispatches over time" 
        />
        <OperatingExpensesChart 
          data={expenseChartData} 
          title="Operating Expenses Trends" 
          description="Aggregates monthly fuel, repairs, and miscellaneous costs" 
        />
      </div>

      {/* Bottom Layout: Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Recent Operations Telemetry</h3>
              <p className="text-xs text-slate-400">Aggregated real-time events feed</p>
            </div>
            <FiActivity className="text-slate-400 w-5 h-5" />
          </div>
          
          <div className="relative border-l border-slate-150 pl-4 ml-2 space-y-6">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">No telemetry recorded yet.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="relative group">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white group-hover:scale-125 transition duration-150" />
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-800">{act.title}</span>
                    <span className="text-[10px] text-slate-400">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-800">Quick Actions</h3>
              <p className="text-xs text-slate-400">Common administrative workflows</p>
            </div>
            
            <div className="space-y-2.5">
              {[
                { label: 'Dispatch Trip', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
                { label: 'Schedule Maintenance', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
                { label: 'Register Vehicle', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
                { label: 'Register Driver', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' }
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => openQuickActionModal(btn.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-bold transition duration-150 cursor-pointer ${btn.color}`}
                >
                  <span>{btn.label}</span>
                  <FiPlus className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-450 leading-relaxed">
            <span className="font-bold text-slate-700 block mb-0.5">Control Info</span>
            Roles and permissions are synchronized securely with the PostgreSQL instance. Use User Management to grant overrides.
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS MODALS */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-500">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-semibold text-emerald-500">
              {formSuccess}
            </div>
          )}

          {/* REGISTER VEHICLE FORM */}
          {modalTitle === 'Register Vehicle' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Plate Number</label>
                  <input required placeholder="MH-12-PQ-1234" value={regNum} onChange={e => setRegNum(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Model Name</label>
                  <input required placeholder="Tata Prima" value={modelName} onChange={e => setModelName(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Type</label>
                  <select value={vType} onChange={e => setVType(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                    <option>Truck</option>
                    <option>Van</option>
                    <option>Bike</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Max Cargo (kg)</label>
                  <input required type="number" placeholder="40000" value={maxLoad} onChange={e => setMaxLoad(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Acquisition Cost (₹)</label>
                  <input required type="number" placeholder="500000" value={acqCost} onChange={e => setAcqCost(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Region</label>
                <select value={region} onChange={e => setRegion(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option>West</option>
                  <option>East</option>
                  <option>North</option>
                  <option>South</option>
                </select>
              </div>
            </div>
          )}

          {/* REGISTER DRIVER FORM */}
          {modalTitle === 'Register Driver' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Driver Name</label>
                  <input required placeholder="Alex Mercer" value={driverName} onChange={e => setDriverName(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">License Number</label>
                  <input required placeholder="DL-12345678" value={licenseNum} onChange={e => setLicenseNum(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">License Category</label>
                  <select value={licenseCat} onChange={e => setLicenseCat(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                    <option>Heavy Transport</option>
                    <option>Light Motor Vehicle</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">License Expiry Date</label>
                  <input required type="date" value={licenseExp} onChange={e => setLicenseExp(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contact Number</label>
                <input placeholder="9876543210" value={contactNum} onChange={e => setContactNum(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
          )}

          {/* DISPATCH TRIP FORM */}
          {modalTitle === 'Dispatch Trip' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Source City</label>
                  <input required placeholder="Mumbai" value={tripSource} onChange={e => setTripSource(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Destination City</label>
                  <input required placeholder="Delhi" value={tripDest} onChange={e => setTripDest(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vehicle Assignment</label>
                  <select required value={tripVehId} onChange={e => setTripVehId(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Driver Assignment</label>
                  <select required value={tripDrvId} onChange={e => setTripDrvId(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                    <option value="">Select driver...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cargo Weight (kg)</label>
                  <input required type="number" min="1" placeholder="25000" value={tripCargo} onChange={e => setTripCargo(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Planned Distance (km)</label>
                  <input required type="number" min="1" placeholder="150" value={tripDist} onChange={e => setTripDist(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE MAINTENANCE FORM */}
          {modalTitle === 'Schedule Maintenance' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Vehicle</label>
                <select required value={maintVehId} onChange={e => setMaintVehId(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Service Type</label>
                  <select value={maintType} onChange={e => setMaintType(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                    <option>Oil Change</option>
                    <option>Tyre Rotation</option>
                    <option>Engine Repair</option>
                    <option>Brake Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Estimated Cost (₹)</label>
                  <input type="number" placeholder="5000" value={maintCost} onChange={e => setMaintCost(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Start Date</label>
                  <input required type="date" value={maintStart} onChange={e => setMaintStart(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description</label>
                  <textarea rows={1} placeholder="Details of repair..." value={maintDesc} onChange={e => setMaintDesc(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button 
              type="button"
              disabled={formSubmitting}
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
