import React, { useState, useEffect } from 'react';
import { WelcomeCard, KPICard } from '../../../components/Cards/Cards';
import { api } from '../../../services/api';
import { Loader } from '../../../components/Loader/Loader';
import { Modal } from '../../../components/Modal/Modal';
import { 
  FiCheckCircle, 
  FiTruck, 
  FiNavigation,
  FiFileText
} from 'react-icons/fi';

interface Trip {
  id: number;
  source: string;
  destination: string;
  cargo_weight_kg: string;
  planned_distance_km: string;
  actual_distance_km: string | null;
  fuel_consumed_liters: string | null;
  status: string;
  created_at: string;
  vehicle?: {
    registration_number: string;
    name_model: string;
  };
}

export const DriverDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  
  // Completion modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [actualDist, setActualDist] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trips');
      const allTrips: Trip[] = res.data.data || [];
      setTrips(allTrips);
      
      // Find trip with Dispatched status
      const active = allTrips.find(t => t.status === 'Dispatched');
      setActiveTrip(active || null);
    } catch (err) {
      console.error('Error fetching driver dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleCompleteTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      await api.patch(`/trips/${activeTrip.id}/complete`, {
        actual_distance_km: parseFloat(actualDist) || undefined,
        fuel_consumed_liters: parseFloat(fuelConsumed) || undefined
      });
      setModalOpen(false);
      setActualDist('');
      setFuelConsumed('');
      fetchDriverData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to complete trip');
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

  // Calculate statistics
  const totalAssigned = trips.length;
  const completedTrips = trips.filter(t => t.status === 'Completed').length;
  const inProgress = trips.filter(t => t.status === 'Dispatched').length;
  const totalDistance = trips
    .filter(t => t.status === 'Completed' && t.actual_distance_km)
    .reduce((sum, t) => sum + parseFloat(t.actual_distance_km || '0'), 0);

  return (
    <div className="space-y-6">
      <WelcomeCard />

      {/* Driver KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Assigned Trips"
          value={totalAssigned.toString()}
          icon={FiFileText}
          change="Trips assigned by dispatcher"
          trend="up"
          color="blue"
        />
        <KPICard
          title="Completed Trips"
          value={completedTrips.toString()}
          icon={FiCheckCircle}
          change={`${totalAssigned - completedTrips} pending completion`}
          trend="up"
          color="green"
        />
        <KPICard
          title="In Transit"
          value={inProgress.toString()}
          icon={FiNavigation}
          change="Active dispatches"
          trend="up"
          color="purple"
        />
        <KPICard
          title="Total Distance Driven"
          value={`${totalDistance.toFixed(0)} km`}
          icon={FiTruck}
          change="From actual completed telemetry"
          trend="up"
          color="orange"
        />
      </div>

      {/* Active Trip Warning or Banner */}
      {activeTrip ? (
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-3xl shadow-lg border border-blue-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-extrabold bg-blue-500 px-3 py-1 rounded-full">Active Transit Mission</span>
            <span className="text-[10px] text-blue-100 font-mono">Trip ID: #{activeTrip.id}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
              <span className="text-xs text-blue-100 font-bold uppercase tracking-wider block">Route</span>
              <p className="text-lg font-bold flex items-center gap-2">
                <span>{activeTrip.source}</span>
                <span className="text-blue-300">→</span>
                <span>{activeTrip.destination}</span>
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs text-blue-100 font-bold uppercase tracking-wider block">Assigned Vehicle</span>
              <p className="text-sm font-semibold">
                {activeTrip.vehicle?.registration_number} ({activeTrip.vehicle?.name_model})
              </p>
            </div>

            <div className="flex md:justify-end">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full md:w-auto px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 rounded-2xl text-xs font-bold transition duration-150 shadow-md shadow-blue-950/20 cursor-pointer"
              >
                Complete Mission & Log Telemetry
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-450">
          No active transit mission is currently assigned. When a dispatcher dispatches a trip, it will display here.
        </div>
      )}

      {/* Driver Trips Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4">Your Assigned Operations Registry</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="py-3 px-4">Trip ID</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Cargo</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No assigned trips found.</td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono">#{t.id}</td>
                    <td className="py-3.5 px-4 font-bold">{t.source}</td>
                    <td className="py-3.5 px-4 font-bold">{t.destination}</td>
                    <td className="py-3.5 px-4">{t.cargo_weight_kg} kg</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {t.vehicle ? `${t.vehicle.registration_number} (${t.vehicle.name_model})` : '--'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        t.status === 'Completed' ? 'bg-emerald-55 text-emerald-800' :
                        t.status === 'Dispatched' ? 'bg-blue-50 text-blue-800' :
                        t.status === 'Cancelled' ? 'bg-rose-50 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Trip Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Complete Trip Report">
        <form onSubmit={handleCompleteTripSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-500">
              {formError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Actual Distance Driven (km)</label>
              <input 
                required 
                type="number" 
                min="1" 
                placeholder="e.g. 152" 
                value={actualDist} 
                onChange={e => setActualDist(e.target.value)} 
                className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" 
              />
            </div>
            
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fuel Consumed (liters)</label>
              <input 
                required 
                type="number" 
                min="1" 
                placeholder="e.g. 48" 
                value={fuelConsumed} 
                onChange={e => setFuelConsumed(e.target.value)} 
                className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" 
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {formSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
