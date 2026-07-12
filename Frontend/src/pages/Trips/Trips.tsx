import React, { useState, useEffect } from 'react';
import { Breadcrumb, Table } from '../../components/Tables/Tables';
import { SearchBar, FilterPlaceholder } from '../../components/Forms/Forms';
import { Modal } from '../../components/Modal/Modal';
import { api } from '../../services/api';
import { FiPlus, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export const Trips: React.FC = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchVal, setSearchVal] = useState('');
  const [filterVal, setFilterVal] = useState('All Statuses');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal Control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view'>('add');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  // Dropdowns for Dispatch Form
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

  // Dispatch Form Fields
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');

  // Complete Trip Fields
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [driverRating, setDriverRating] = useState('5');
  const [driverFeedback, setDriverFeedback] = useState('');

  // Submit Feedback
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const breadcrumbItems = [
    { label: 'TransitOps', href: '/' },
    { label: 'Trips', active: true }
  ];

  const columns = [
    { header: 'Trip ID', accessor: 'id' },
    { header: 'Vehicle Plate', accessor: 'vehicle.registration_number' },
    { header: 'Driver Name', accessor: 'driver.name' },
    { header: 'Origin', accessor: 'source' },
    { header: 'Destination', accessor: 'destination' },
    { header: 'Status', accessor: 'status' }
  ];

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/trips');
      setTrips(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dispatch trips logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const loadSelectionOptions = async () => {
    try {
      const vRes = await api.get('/vehicles');
      setAvailableVehicles((vRes.data.data || []).filter((v: any) => v.status === 'Available'));
      
      const dRes = await api.get('/drivers');
      // Filter out suspended or expired drivers
      const today = new Date();
      today.setHours(0,0,0,0);
      setAvailableDrivers((dRes.data.data || []).filter((d: any) => {
        const isExp = new Date(d.license_expiry_date) < today;
        return d.status === 'Available' && !isExp;
      }));
    } catch (err) {
      console.error('Failed loading resources dropdowns:', err);
    }
  };

  // Filter & Search application
  const filteredTrips = trips.filter((t) => {
    const matchesSearch = 
      t.source.toLowerCase().includes(searchVal.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchVal.toLowerCase()) ||
      (t.vehicle?.registration_number && t.vehicle.registration_number.toLowerCase().includes(searchVal.toLowerCase())) ||
      (t.driver?.name && t.driver.name.toLowerCase().includes(searchVal.toLowerCase()));

    const matchesStatus = 
      filterVal === 'All Statuses' || 
      t.status.toLowerCase() === filterVal.toLowerCase() ||
      (filterVal === 'Scheduled' && t.status === 'Draft') ||
      (filterVal === 'In Transit' && t.status === 'Dispatched');

    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalEntries = filteredTrips.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedData = filteredTrips.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleOpenAddModal = async () => {
    setModalMode('add');
    setSource('');
    setDestination('');
    setVehicleId('');
    setDriverId('');
    setCargoWeight('');
    setPlannedDistance('');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
    await loadSelectionOptions();
  };

  const handleOpenViewModal = (item: any) => {
    setModalMode('view');
    setSelectedTrip(item);
    setShowCompleteForm(false);
    setActualDistance('');
    setFuelConsumed('');
    setDriverRating('5');
    setDriverFeedback('');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormSubmitting(true);

    try {
      await api.post('/trips', {
        source,
        destination,
        vehicle_id: Number(vehicleId),
        driver_id: Number(driverId),
        cargo_weight_kg: Number(cargoWeight),
        planned_distance_km: Number(plannedDistance)
      });
      setFormSuccess('Trip created in Draft status!');
      await fetchTrips();
      setTimeout(() => setModalOpen(false), 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to construct trip.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDispatchTrip = async () => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.patch(`/trips/${selectedTrip.id}/dispatch`);
      setFormSuccess('Trip dispatched! Fleet status changed to On Trip.');
      await fetchTrips();
      // Reload details to display dispatched status
      const updated = await api.get(`/trips/${selectedTrip.id}`);
      setSelectedTrip(updated.data.data);
    } catch (err: any) {
      setFormError(err.message || 'Dispatch workflow failed.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCancelTrip = async () => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.patch(`/trips/${selectedTrip.id}/cancel`);
      setFormSuccess('Trip cancelled and assets released.');
      await fetchTrips();
      const updated = await api.get(`/trips/${selectedTrip.id}`);
      setSelectedTrip(updated.data.data);
    } catch (err: any) {
      setFormError(err.message || 'Cancellation request failed.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCompleteTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.patch(`/trips/${selectedTrip.id}/complete`, {
        actual_distance_km: Number(actualDistance),
        fuel_consumed_liters: Number(fuelConsumed),
        rating: Number(driverRating),
        feedback: driverFeedback
      });
      
      // Also automatically log fuel expense
      try {
        await api.post('/expenses', {
          vehicle_id: selectedTrip.vehicle_id,
          trip_id: selectedTrip.id,
          expense_type: 'Fuel',
          amount: Number(fuelConsumed) * 100, // proxy cost estimate
          expense_date: new Date().toISOString(),
          description: `Fuel for trip #${selectedTrip.id}`
        });
      } catch (err) {
        console.error('Fuel expense logging skipped:', err);
      }

      setFormSuccess('Trip completed! Odometer updated and assets released.');
      await fetchTrips();
      const updated = await api.get(`/trips/${selectedTrip.id}`);
      setSelectedTrip(updated.data.data);
      setShowCompleteForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Trip completion failed.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumb items={breadcrumbItems} />
          <h2 className="text-xl font-bold text-slate-800">Trips & Dispatch</h2>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition duration-150 shadow-sm shadow-blue-200"
        >
          <FiPlus className="w-4 h-4" />
          <span>Dispatch Trip</span>
        </button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <SearchBar 
          placeholder="Search trip destination, route ID..." 
          value={searchVal}
          onChange={(val) => {
            setSearchVal(val);
            setPage(1);
          }}
        />
        <FilterPlaceholder 
          options={['All Statuses', 'Scheduled', 'In Transit', 'Completed', 'Cancelled']}
          selected={filterVal}
          onSelect={(val) => {
            setFilterVal(val);
            setPage(1);
          }}
        />
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3 text-rose-600 text-sm">
          <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Connectivity Error</h4>
            <p className="text-xs text-rose-500 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Trips Table */}
      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyStateTitle="No trips dispatched"
        emptyStateDescription="Dispatch active vehicles and drivers on dynamic routes to track logistics logs."
        actionLabel="Dispatch Trip"
        onActionClick={handleOpenAddModal}
        onView={handleOpenViewModal}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalEntries={totalEntries}
        onPageChange={setPage}
      />

      {/* Modals */}
      <Modal isOpen={modalOpen} onClose={() => !formSubmitting && setModalOpen(false)} title={modalMode === 'add' ? 'Dispatch New Route' : 'Trip Coordination Control'}>
        {modalMode === 'add' ? (
          <form onSubmit={handleCreateTrip} className="space-y-4">
            {formError && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs">{formSuccess}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Source / Origin</label>
                <input required placeholder="Mumbai" value={source} onChange={e => setSource(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Destination</label>
                <input required placeholder="Pune" value={destination} onChange={e => setDestination(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Vehicle</label>
                <select required value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option value="">Select available...</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assign Driver</label>
                <select required value={driverId} onChange={e => setDriverId(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option value="">Select active...</option>
                  {availableDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cargo Weight (kg)</label>
                <input required type="number" min="1" placeholder="30000" value={cargoWeight} onChange={e => setCargoWeight(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Planned Distance (km)</label>
                <input required type="number" min="1" placeholder="150" value={plannedDistance} onChange={e => setPlannedDistance(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button type="button" disabled={formSubmitting} onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button type="submit" disabled={formSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">Dispatch</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {formError && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs">{formSuccess}</div>}

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Route vector</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block">{selectedTrip?.source} → {selectedTrip?.destination}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Current Status</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block uppercase">{selectedTrip?.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Vehicle Assigned</span>
                <span className="text-slate-800 text-xs font-semibold mt-1 block">{selectedTrip?.vehicle?.registration_number} ({selectedTrip?.vehicle?.name_model})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Driver Assigned</span>
                <span className="text-slate-800 text-xs font-semibold mt-1 block">{selectedTrip?.driver?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Planned Distance</span>
                <span className="text-slate-800 text-xs font-semibold mt-1 block">{selectedTrip?.planned_distance_km} km</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Cargo Load</span>
                <span className="text-slate-800 text-xs font-semibold mt-1 block">{selectedTrip?.cargo_weight_kg} kg</span>
              </div>
              {selectedTrip?.actual_distance_km && (
                <div>
                  <span className="text-slate-400 block font-semibold uppercase tracking-wide">Actual Odometer Distance</span>
                  <span className="text-slate-800 text-xs font-semibold mt-1 block">{selectedTrip?.actual_distance_km} km</span>
                </div>
              )}
              {selectedTrip?.fuel_consumed_liters && (
                <div>
                  <span className="text-slate-400 block font-semibold uppercase tracking-wide">Fuel Consumed</span>
                  <span className="text-slate-800 text-xs font-semibold mt-1 block">{selectedTrip?.fuel_consumed_liters} L</span>
                </div>
              )}
            </div>

            {/* Complete Trip Input form */}
            {showCompleteForm && (
              <form onSubmit={handleCompleteTripSubmit} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-600 block">Complete Route Telemetry Details</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Actual Distance (km)</label>
                    <input required type="number" min="1" placeholder="148" value={actualDistance} onChange={e => setActualDistance(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fuel Consumed (Liters)</label>
                    <input required type="number" min="1" placeholder="45" value={fuelConsumed} onChange={e => setFuelConsumed(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Driver Rating (1-5)</label>
                    <select value={driverRating} onChange={e => setDriverRating(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                      <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                      <option value="4">⭐⭐⭐⭐ (4)</option>
                      <option value="3">⭐⭐⭐ (3)</option>
                      <option value="2">⭐⭐ (2)</option>
                      <option value="1">⭐ (1)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Driver Feedback</label>
                    <input placeholder="Safe driving, on time delivery" value={driverFeedback} onChange={e => setDriverFeedback(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowCompleteForm(false)} className="px-3 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" disabled={formSubmitting} className="px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Submit Completion</button>
                </div>
              </form>
            )}

            {/* Contextual Actions Panel */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="flex space-x-2">
                {selectedTrip?.status === 'Draft' && (
                  <>
                    <button type="button" disabled={formSubmitting} onClick={handleDispatchTrip} className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      <span>Dispatch Trip</span>
                    </button>
                    <button type="button" disabled={formSubmitting} onClick={handleCancelTrip} className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition">
                      <FiXCircle className="w-3.5 h-3.5" />
                      <span>Cancel Trip</span>
                    </button>
                  </>
                )}

                {selectedTrip?.status === 'Dispatched' && !showCompleteForm && (
                  <>
                    <button type="button" onClick={() => setShowCompleteForm(true)} className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      <span>Complete Trip</span>
                    </button>
                    <button type="button" disabled={formSubmitting} onClick={handleCancelTrip} className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition">
                      <FiXCircle className="w-3.5 h-3.5" />
                      <span>Cancel Trip</span>
                    </button>
                  </>
                )}
              </div>
              
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
