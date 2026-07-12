import React, { useState, useEffect } from 'react';
import { Breadcrumb, Table } from '../../components/Tables/Tables';
import { SearchBar, FilterPlaceholder } from '../../components/Forms/Forms';
import { Modal } from '../../components/Modal/Modal';
import { api } from '../../services/api';
import { FiPlus, FiAlertTriangle } from 'react-icons/fi';

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchVal, setSearchVal] = useState('');
  const [filterVal, setFilterVal] = useState('All Statuses');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | 'view'>('add');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Form Fields
  const [regNum, setRegNum] = useState('');
  const [modelName, setModelName] = useState('');
  const [vType, setVType] = useState('Truck');
  const [maxLoad, setMaxLoad] = useState('');
  const [acqCost, setAcqCost] = useState('');
  const [region, setRegion] = useState('West');
  const [vStatus, setVStatus] = useState('Available');

  // Submit Feedback
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const breadcrumbItems = [
    { label: 'TransitOps', href: '/' },
    { label: 'Vehicles', active: true }
  ];

  const columns = [
    { header: 'Plate Number', accessor: 'registration_number' },
    { header: 'Model', accessor: 'name_model' },
    { header: 'Type', accessor: 'type' },
    { header: 'Status', accessor: 'status' },
    { header: 'Odometer (km)', accessor: 'odometer_km' }
  ];

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load fleet registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filter & Search application
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = 
      v.registration_number.toLowerCase().includes(searchVal.toLowerCase()) ||
      v.name_model.toLowerCase().includes(searchVal.toLowerCase()) ||
      (v.type && v.type.toLowerCase().includes(searchVal.toLowerCase()));
      
    const matchesStatus = 
      filterVal === 'All Statuses' || 
      v.status.toLowerCase() === filterVal.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Paginated chunk calculation
  const totalEntries = filteredVehicles.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedData = filteredVehicles.slice((page - 1) * pageSize, page * pageSize);

  // Sync page index
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setRegNum('');
    setModelName('');
    setVType('Truck');
    setMaxLoad('');
    setAcqCost('');
    setRegion('West');
    setVStatus('Available');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setModalMode('edit');
    setSelectedVehicle(item);
    setRegNum(item.registration_number);
    setModelName(item.name_model);
    setVType(item.type || 'Truck');
    setMaxLoad(String(item.max_load_capacity_kg));
    setAcqCost(String(item.acquisition_cost));
    setRegion(item.region || 'West');
    setVStatus(item.status);
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (item: any) => {
    setModalMode('delete');
    setSelectedVehicle(item);
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleOpenViewModal = (item: any) => {
    setModalMode('view');
    setSelectedVehicle(item);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormSubmitting(true);

    try {
      const payload = {
        registration_number: regNum,
        name_model: modelName,
        type: vType,
        max_load_capacity_kg: Number(maxLoad),
        acquisition_cost: Number(acqCost),
        region,
        status: vStatus
      };

      if (modalMode === 'add') {
        await api.post('/vehicles', payload);
        setFormSuccess('Vehicle registered successfully!');
      } else if (modalMode === 'edit') {
        // Wait, the backend PUT endpoint updates status too, but status is updated via transactions in trips/maintenance.
        // The PUT /api/vehicles/:id handles updates to vehicle properties.
        await api.put(`/vehicles/${selectedVehicle.id}`, payload);
        setFormSuccess('Vehicle details updated successfully!');
      }

      await fetchVehicles();
      setTimeout(() => setModalOpen(false), 1500);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please review inputs.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.delete(`/vehicles/${selectedVehicle.id}`);
      setFormSuccess('Vehicle removed from registry!');
      await fetchVehicles();
      setTimeout(() => setModalOpen(false), 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete vehicle.');
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
          <h2 className="text-xl font-bold text-slate-800">Fleet Inventory</h2>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition duration-150 shadow-sm shadow-blue-200"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <SearchBar 
          placeholder="Search plate number, model..." 
          value={searchVal}
          onChange={(val) => {
            setSearchVal(val);
            setPage(1);
          }}
        />
        <FilterPlaceholder 
          options={['All Statuses', 'Available', 'On Trip', 'In Shop', 'Retired']}
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

      {/* Vehicles Table */}
      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyStateTitle="No vehicles registered"
        emptyStateDescription="Get started by registering a vehicle in your active fleet."
        actionLabel="Register Vehicle"
        onActionClick={handleOpenAddModal}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
        onView={handleOpenViewModal}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalEntries={totalEntries}
        onPageChange={setPage}
      />

      {/* Modals */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => !formSubmitting && setModalOpen(false)} 
        title={
          modalMode === 'add' 
            ? 'Register New Vehicle' 
            : modalMode === 'edit'
              ? 'Edit Vehicle Details'
              : modalMode === 'delete'
                ? 'Decommission Vehicle'
                : 'Vehicle Information'
        }
      >
        {modalMode === 'delete' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Are you sure you want to permanently decommission and delete vehicle **{selectedVehicle?.registration_number}** ({selectedVehicle?.name_model})? This action is irreversible.
            </p>
            {formError && <p className="text-xs text-rose-600 font-semibold">{formError}</p>}
            {formSuccess && <p className="text-xs text-emerald-600 font-semibold">{formSuccess}</p>}
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button 
                type="button"
                disabled={formSubmitting}
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={formSubmitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                {formSubmitting ? 'Deleting...' : 'Decommission'}
              </button>
            </div>
          </div>
        ) : modalMode === 'view' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Plate Number</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block">{selectedVehicle?.registration_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Model / Name</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block">{selectedVehicle?.name_model}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Vehicle Type</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">{selectedVehicle?.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Current Status</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block uppercase">{selectedVehicle?.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Max Load Capacity</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">{selectedVehicle?.max_load_capacity_kg} kg</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Odometer</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">{selectedVehicle?.odometer_km} km</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Acquisition Cost</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">₹{Number(selectedVehicle?.acquisition_cost).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Operational Region</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">{selectedVehicle?.region || 'Not set'}</span>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Plate Number</label>
                <input required placeholder="MH-12-PQ-1234" value={regNum} onChange={e => setRegNum(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Model Name</label>
                <input required placeholder="Tata Prima 4925" value={modelName} onChange={e => setModelName(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
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
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Acquisition Cost (₹)</label>
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

            {modalMode === 'edit' && (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vehicle Status</label>
                <select value={vStatus} onChange={e => setVStatus(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option>Available</option>
                  <option>On Trip</option>
                  <option>In Shop</option>
                  <option>Retired</option>
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button 
                type="button"
                disabled={formSubmitting}
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={formSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                {formSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
