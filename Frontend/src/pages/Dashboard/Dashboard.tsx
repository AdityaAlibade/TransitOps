import React, { useState, useEffect } from 'react';
import { WelcomeCard, KPICard } from '../../components/Cards/Cards';
import { TripPerformanceChart, OperatingExpensesChart } from '../../components/Charts/Charts';
import { Modal } from '../../components/Modal/Modal';
import { api } from '../../services/api';
import { Loader } from '../../components/Loader/Loader';
import { 
  FiTruck, 
  FiMapPin, 
  FiUsers, 
  FiTool, 
  FiPlus,
  FiDollarSign,
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

export const Dashboard: React.FC = () => {
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
      // 1. Fetch KPIs
      const kpisRes = await api.get('/dashboard/kpis');
      setKpis(kpisRes.data.data);

      // 2. Fetch Trips for Chart
      const tripsRes = await api.get('/trips');
      const allTrips = tripsRes.data.data || [];

      // 3. Fetch Expenses for Chart
      const expensesRes = await api.get('/expenses');
      const allExpenses = expensesRes.data.data || [];

      // Process Trip Chart Data (group by month)
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

      // Process Expense Chart Data (group by month)
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

      // Process recent activities feed
      const feed: ActivityEvent[] = [];
      // Grab top 3 recent trips
      allTrips.slice(0, 3).forEach((t: any) => {
        feed.push({
          id: `trip-${t.id}`,
          type: 'trip',
          title: `Trip ${t.status}`,
          description: `${t.source} to ${t.destination} - Cargo: ${t.cargo_weight_kg}kg`,
          time: new Date(t.created_at).toLocaleString()
        });
      });

      // Grab top 2 recent expenses
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
      console.error('Error loading selection options:', err);
    }
  };

  const triggerQuickAction = async (actionName: string) => {
    setModalTitle(actionName);
    setFormError(null);
    setFormSuccess(null);
    
    // Reset forms
    setRegNum(''); setModelName(''); setMaxLoad(''); setAcqCost('');
    setDriverName(''); setLicenseNum(''); setContactNum(''); setLicenseExp('');
    setTripSource(''); setTripDest(''); setTripCargo(''); setTripDist('');
    setMaintDesc(''); setMaintCost(''); setMaintStart('');

    // Pre-load data if trip or maintenance
    if (actionName === 'Dispatch New Trip' || actionName === 'Schedule Maintenance') {
      await loadDropdownOptions();
    }
    
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormSubmitting(true);

    try {
      if (modalTitle === 'Register New Vehicle') {
        await api.post('/vehicles', {
          registration_number: regNum,
          name_model: modelName,
          type: vType,
          max_load_capacity_kg: Number(maxLoad),
          acquisition_cost: Number(acqCost),
          region
        });
        setFormSuccess('Vehicle registered successfully!');
      } 
      else if (modalTitle === 'Register New Driver') {
        await api.post('/drivers', {
          name: driverName,
          license_number: licenseNum,
          license_category: licenseCat,
          license_expiry_date: new Date(licenseExp).toISOString(),
          contact_number: contactNum
        });
        setFormSuccess('Driver registered successfully!');
      } 
      else if (modalTitle === 'Dispatch New Trip') {
        const trip = await api.post('/trips', {
          source: tripSource,
          destination: tripDest,
          vehicle_id: Number(tripVehId),
          driver_id: Number(tripDrvId),
          cargo_weight_kg: Number(tripCargo),
          planned_distance_km: Number(tripDist)
        });
        // Dispatch right away
        await api.patch(`/trips/${trip.data.data.id}/dispatch`);
        setFormSuccess('Trip created and dispatched successfully!');
      } 
      else if (modalTitle === 'Schedule Maintenance') {
        await api.post('/maintenance', {
          vehicle_id: Number(maintVehId),
          maintenance_type: maintType,
          description: maintDesc,
          cost: maintCost ? Number(maintCost) : 0,
          start_date: new Date(maintStart).toISOString()
        });
        setFormSuccess('Maintenance task scheduled successfully!');
      }

      // Reload dashboard KPIs and stats
      fetchDashboardData();
      
      // Auto close after brief delay
      setTimeout(() => {
        setModalOpen(false);
      }, 1500);

    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Verify form values.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'trip': return <FiMapPin className="text-blue-500 w-4 h-4" />;
      case 'expense': return <FiDollarSign className="text-emerald-500 w-4 h-4" />;
      case 'maintenance': return <FiTool className="text-orange-500 w-4 h-4" />;
      default: return <FiActivity className="text-slate-500 w-4 h-4" />;
    }
  };

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <WelcomeCard />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Vehicles"
          value={kpis?.totalVehicles ?? '--'}
          icon={FiTruck}
          change={`${kpis?.fleetUtilization ?? 0}%`}
          trend="up"
          color="blue"
        />
        <KPICard
          title="Active Trips"
          value={kpis?.activeTrips ?? '--'}
          icon={FiMapPin}
          change={`${kpis?.pendingTrips ?? 0} Pending`}
          trend="up"
          color="green"
        />
        <KPICard
          title="Drivers Active"
          value={kpis?.driversOnDuty ?? '--'}
          icon={FiUsers}
          change={`${kpis?.availableDrivers ?? 0} Available`}
          trend="down"
          color="purple"
        />
        <KPICard
          title="In Repair Shop"
          value={kpis?.vehiclesInShop ?? '--'}
          icon={FiTool}
          change={`${kpis?.expiringLicenses ?? 0} Expiring Lic`}
          trend="up"
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TripPerformanceChart 
          title="Trip Performance Overview" 
          description="Monitors successful completions and active dispatches over time"
          data={tripChartData}
        />
        <OperatingExpensesChart 
          title="Operating Expenses Trends" 
          description="Aggregates monthly fuel, repairs, and miscellaneous costs"
          data={expenseChartData}
        />
      </div>

      {/* Bottom Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Card */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800">Recent System Activity</h3>
            <p className="text-xs text-slate-400">Chronological list of background telemetry and events</p>
          </div>
          
          <div className="relative border-l border-slate-100 pl-4 space-y-6 min-h-[200px] flex flex-col justify-start">
            {activities.length === 0 ? (
              <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
                <span className="text-sm font-medium text-slate-400">No activity logs recorded</span>
                <p className="text-xs text-slate-300 mt-1">Vehicle telemetry events will display here in real-time.</p>
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="relative pl-2">
                  <span className="absolute -left-[25px] mt-1 bg-white border border-slate-100 p-1 rounded-full shadow-sm">
                    {getEventIcon(act.type)}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800">{act.title}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">{act.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-800">Quick Actions</h3>
              <p className="text-xs text-slate-400">Common administrative workflows</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => triggerQuickAction('Register New Vehicle')}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 rounded-xl transition duration-200 group text-slate-600"
              >
                <FiPlus className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-center">New Vehicle</span>
              </button>
              <button
                onClick={() => triggerQuickAction('Register New Driver')}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 rounded-xl transition duration-200 group text-slate-600"
              >
                <FiUsers className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-center">New Driver</span>
              </button>
              <button
                onClick={() => triggerQuickAction('Dispatch New Trip')}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 rounded-xl transition duration-200 group text-slate-600"
              >
                <FiMapPin className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-center">Dispatch Trip</span>
              </button>
              <button
                onClick={() => triggerQuickAction('Schedule Maintenance')}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 rounded-xl transition duration-200 group text-slate-600"
              >
                <FiTool className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-center">Schedule Repair</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              System Operations Hub
            </span>
          </div>
        </div>

      </div>

      {/* Quick Action Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-medium">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-medium">
              {formSuccess}
            </div>
          )}

          {/* REGISTER VEHICLE FORM */}
          {modalTitle === 'Register New Vehicle' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Plate Number</label>
                  <input required placeholder="MH-12-PQ-1234" value={regNum} onChange={e => setRegNum(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Model Name</label>
                  <input required placeholder="Tata Prima 4925" value={modelName} onChange={e => setModelName(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vehicle Type</label>
                  <select value={vType} onChange={e => setVType(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                    <option>Truck</option>
                    <option>Van</option>
                    <option>Bike</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Max Capacity (kg)</label>
                  <input required type="number" min="1" placeholder="40000" value={maxLoad} onChange={e => setMaxLoad(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Acquisition Cost</label>
                  <input required type="number" min="1" placeholder="5000000" value={acqCost} onChange={e => setAcqCost(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
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
            </div>
          )}

          {/* REGISTER DRIVER FORM */}
          {modalTitle === 'Register New Driver' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Name</label>
                  <input required placeholder="Alex Driver" value={driverName} onChange={e => setDriverName(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">License Number</label>
                  <input required placeholder="DL-12345678" value={licenseNum} onChange={e => setLicenseNum(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Category</label>
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
          {modalTitle === 'Dispatch New Trip' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Source</label>
                  <input required placeholder="Mumbai" value={tripSource} onChange={e => setTripSource(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Destination</label>
                  <input required placeholder="Pune" value={tripDest} onChange={e => setTripDest(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
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
