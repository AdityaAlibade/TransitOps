import React, { useState, useEffect } from 'react';
import { Breadcrumb, Table } from '../../components/Tables/Tables';
import { SearchBar, FilterPlaceholder } from '../../components/Forms/Forms';
import { Modal } from '../../components/Modal/Modal';
import { api } from '../../services/api';
import { FiPlus, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export const Maintenance: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
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
  const [modalMode, setModalMode] = useState<'add' | 'view' | 'delete'>('add');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Schedule Form Fields
  const [vehicleId, setVehicleId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('Oil Change');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [startDate, setStartDate] = useState('');

  // Close Form Fields
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [actualCost, setActualCost] = useState('');

  // Submit Feedback
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const breadcrumbItems = [
    { label: 'TransitOps', href: '/' },
    { label: 'Maintenance', active: true }
  ];

  const columns = [
    { header: 'Record ID', accessor: 'id' },
    { header: 'Vehicle Plate', accessor: 'vehicle.registration_number' },
    { header: 'Service Type', accessor: 'maintenance_type' },
    { header: 'Status', accessor: 'status' },
    { header: 'Start Date', accessor: 'start_date' }
  ];

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/maintenance');
      setLogs(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch maintenance logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      // Exclude retired vehicles
      setVehicles((res.data.data || []).filter((v: any) => v.status !== 'Retired'));
    } catch (err) {
      console.error('Failed loading vehicles options:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter & Search application
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.maintenance_type.toLowerCase().includes(searchVal.toLowerCase()) ||
      (log.description && log.description.toLowerCase().includes(searchVal.toLowerCase())) ||
      (log.vehicle?.registration_number && log.vehicle.registration_number.toLowerCase().includes(searchVal.toLowerCase()));
      
    const matchesStatus = 
      filterVal === 'All Statuses' || 
      log.status.toLowerCase() === filterVal.toLowerCase() ||
      (filterVal === 'Pending' && log.status === 'Active') ||
      (filterVal === 'In Progress' && log.status === 'Active');

    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalEntries = filteredLogs.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedData = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleOpenAddModal = async () => {
    setModalMode('add');
    setVehicleId('');
    setMaintenanceType('Oil Change');
    setDescription('');
    setCost('');
    setStartDate('');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
    await fetchVehicles();
  };

  const handleOpenViewModal = (item: any) => {
    setModalMode('view');
    setSelectedLog(item);
    setShowCloseForm(false);
    setEndDate('');
    setActualCost(String(item.cost));
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (item: any) => {
    setModalMode('delete');
    setSelectedLog(item);
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormSubmitting(true);

    try {
      await api.post('/maintenance', {
        vehicle_id: Number(vehicleId),
        maintenance_type: maintenanceType,
        description,
        cost: cost ? Number(cost) : 0,
        start_date: new Date(startDate).toISOString()
      });
      
      // Also automatically log expense
      try {
        await api.post('/expenses', {
          vehicle_id: Number(vehicleId),
          expense_type: 'Maintenance',
          amount: cost ? Number(cost) : 0,
          expense_date: new Date(startDate).toISOString(),
          description: `Scheduled maintenance: ${maintenanceType}`
        });
      } catch (e) {
        console.error('Expense logging failed:', e);
      }

      setFormSuccess('Maintenance task scheduled! Vehicle status changed to In Shop.');
      await fetchLogs();
      setTimeout(() => setModalOpen(false), 1500);
    } catch (err: any) {
      setFormError(err.message || 'Scheduling request failed.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCloseLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.patch(`/maintenance/${selectedLog.id}/close`, {
        end_date: endDate ? new Date(endDate).toISOString() : new Date().toISOString(),
        cost: Number(actualCost)
      });
      setFormSuccess('Service log closed! Vehicle status restored to Available.');
      await fetchLogs();
      const updated = await api.get('/maintenance');
      const found = (updated.data.data || []).find((l: any) => l.id === selectedLog.id);
      if (found) setSelectedLog(found);
      setShowCloseForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to close log.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.delete(`/maintenance/${selectedLog.id}`);
      setFormSuccess('Maintenance record deleted successfully!');
      await fetchLogs();
      setTimeout(() => setModalOpen(false), 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete maintenance log.');
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
          <h2 className="text-xl font-bold text-slate-800">Service Schedules</h2>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition duration-150 shadow-sm shadow-blue-200"
        >
          <FiPlus className="w-4 h-4" />
          <span>Schedule Service</span>
        </button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <SearchBar 
          placeholder="Search plate number, repair type..." 
          value={searchVal}
          onChange={(val) => {
            setSearchVal(val);
            setPage(1);
          }}
        />
        <FilterPlaceholder 
          options={['All Statuses', 'Active', 'Closed']}
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

      {/* Maintenance Table */}
      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyStateTitle="No service logs available"
        emptyStateDescription="Schedule safety inspections, mechanical maintenance, or active repairs to prevent operations downtime."
        actionLabel="Schedule Service"
        onActionClick={handleOpenAddModal}
        onView={handleOpenViewModal}
        onDelete={handleOpenDeleteModal}
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
            ? 'Schedule Service Task' 
            : modalMode === 'delete'
              ? 'Delete Service Entry'
              : 'Maintenance Log Details'
        }
      >
        {modalMode === 'delete' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Are you sure you want to permanently delete maintenance log entry **#{selectedLog?.id}**? If the status was Active, the vehicle's status will revert to Available.
            </p>
            {formError && <p className="text-xs text-rose-600 font-semibold">{formError}</p>}
            {formSuccess && <p className="text-xs text-emerald-600 font-semibold">{formSuccess}</p>}
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button type="button" disabled={formSubmitting} onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button type="button" disabled={formSubmitting} onClick={handleDeleteConfirm} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition">
                {formSubmitting ? 'Deleting...' : 'Delete Log'}
              </button>
            </div>
          </div>
        ) : modalMode === 'add' ? (
          <form onSubmit={handleCreateLog} className="space-y-4">
            {formError && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs">{formSuccess}</div>}

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Vehicle</label>
              <select required value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option value="">Select vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Service Type</label>
                <select value={maintenanceType} onChange={e => setMaintenanceType(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option>Oil Change</option>
                  <option>Tyre Rotation</option>
                  <option>Engine Repair</option>
                  <option>Brake Inspection</option>
                  <option>Other Repair</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cost Estimate (₹)</label>
                <input type="number" placeholder="5000" value={cost} onChange={e => setCost(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Start Date</label>
                <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Task Description</label>
                <textarea rows={1} placeholder="Details of issues..." value={description} onChange={e => setDescription(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button type="button" disabled={formSubmitting} onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button type="submit" disabled={formSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">Confirm</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {formError && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs">{formSuccess}</div>}

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Vehicle Plate</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block">{selectedLog?.vehicle?.registration_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Service Category</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block">{selectedLog?.maintenance_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Current Status</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block uppercase">{selectedLog?.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Mechanical Cost</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">₹{Number(selectedLog?.cost).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Start Date</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">
                  {selectedLog?.start_date ? new Date(selectedLog.start_date).toLocaleDateString('en-IN') : '--'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Close Date</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">
                  {selectedLog?.end_date ? new Date(selectedLog.end_date).toLocaleDateString('en-IN') : '--'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Service Details / Description</span>
                <span className="text-slate-800 text-xs font-medium mt-1 block bg-white p-2 border border-slate-100 rounded-lg">{selectedLog?.description || 'No description recorded'}</span>
              </div>
            </div>

            {/* Close Maintenance Mini Form */}
            {showCloseForm && (
              <form onSubmit={handleCloseLogSubmit} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-600 block">Close Maintenance Request Details</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Final Service Cost (₹)</label>
                    <input required type="number" min="0" placeholder="6500" value={actualCost} onChange={e => setActualCost(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Completion Date</label>
                    <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowCloseForm(false)} className="px-3 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" disabled={formSubmitting} className="px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Close Request</button>
                </div>
              </form>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div>
                {selectedLog?.status === 'Active' && !showCloseForm && (
                  <button type="button" onClick={() => setShowCloseForm(true)} className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition">
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    <span>Close Task</span>
                  </button>
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
