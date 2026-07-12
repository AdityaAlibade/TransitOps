import React, { useState, useEffect } from 'react';
import { Breadcrumb, Table } from '../../components/Tables/Tables';
import { SearchBar, FilterPlaceholder } from '../../components/Forms/Forms';
import { Modal } from '../../components/Modal/Modal';
import { api } from '../../services/api';
import { FiPlus, FiAlertTriangle } from 'react-icons/fi';

export const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
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
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  // Form Fields
  const [driverName, setDriverName] = useState('');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseCat, setLicenseCat] = useState('Heavy Transport');
  const [licenseExp, setLicenseExp] = useState('');
  const [contactNum, setContactNum] = useState('');
  const [driverStatus, setDriverStatus] = useState('Available');

  // Submit Feedback
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const breadcrumbItems = [
    { label: 'TransitOps', href: '/' },
    { label: 'Drivers', active: true }
  ];

  const columns = [
    { header: 'Driver ID', accessor: 'id' },
    { header: 'Full Name', accessor: 'name' },
    { header: 'License Number', accessor: 'license_number' },
    { header: 'Status', accessor: 'status' },
    { header: 'Phone Number', accessor: 'contact_number' }
  ];

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load drivers registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Filter & Search application
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      d.license_number.toLowerCase().includes(searchVal.toLowerCase()) ||
      (d.contact_number && d.contact_number.includes(searchVal)) ||
      (d.license_category && d.license_category.toLowerCase().includes(searchVal.toLowerCase()));
      
    const matchesStatus = 
      filterVal === 'All Statuses' || 
      d.status.toLowerCase() === filterVal.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Paginated chunk calculation
  const totalEntries = filteredDrivers.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedData = filteredDrivers.slice((page - 1) * pageSize, page * pageSize);

  // Sync page index
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setDriverName('');
    setLicenseNum('');
    setLicenseCat('Heavy Transport');
    setLicenseExp('');
    setContactNum('');
    setDriverStatus('Available');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setModalMode('edit');
    setSelectedDriver(item);
    setDriverName(item.name);
    setLicenseNum(item.license_number);
    setLicenseCat(item.license_category || 'Heavy Transport');
    
    // Format date to YYYY-MM-DD
    if (item.license_expiry_date) {
      const d = new Date(item.license_expiry_date);
      if (!isNaN(d.getTime())) {
        setLicenseExp(d.toISOString().split('T')[0]);
      }
    } else {
      setLicenseExp('');
    }
    
    setContactNum(item.contact_number || '');
    setDriverStatus(item.status);
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (item: any) => {
    setModalMode('delete');
    setSelectedDriver(item);
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleOpenViewModal = (item: any) => {
    setModalMode('view');
    setSelectedDriver(item);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormSubmitting(true);

    try {
      const payload = {
        name: driverName,
        license_number: licenseNum,
        license_category: licenseCat,
        license_expiry_date: new Date(licenseExp).toISOString(),
        contact_number: contactNum,
        status: driverStatus
      };

      if (modalMode === 'add') {
        await api.post('/drivers', payload);
        setFormSuccess('Driver registered successfully!');
      } else if (modalMode === 'edit') {
        await api.put(`/drivers/${selectedDriver.id}`, payload);
        setFormSuccess('Driver details updated successfully!');
      }

      await fetchDrivers();
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
      await api.delete(`/drivers/${selectedDriver.id}`);
      setFormSuccess('Driver removed from registry!');
      await fetchDrivers();
      setTimeout(() => setModalOpen(false), 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete driver.');
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
          <h2 className="text-xl font-bold text-slate-800">Driver Registry</h2>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition duration-150 shadow-sm shadow-blue-200"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <SearchBar 
          placeholder="Search driver name, license..." 
          value={searchVal}
          onChange={(val) => {
            setSearchVal(val);
            setPage(1);
          }}
        />
        <FilterPlaceholder 
          options={['All Statuses', 'Available', 'On Trip', 'Suspended', 'Off Duty']}
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

      {/* Drivers Table */}
      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyStateTitle="No drivers registered"
        emptyStateDescription="Add certified drivers to assign routes and dispatch trips."
        actionLabel="Register Driver"
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
            ? 'Register New Driver' 
            : modalMode === 'edit'
              ? 'Edit Driver Details'
              : modalMode === 'delete'
                ? 'Remove Driver Record'
                : 'Driver Information'
        }
      >
        {modalMode === 'delete' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Are you sure you want to permanently delete driver **{selectedDriver?.name}** (License: {selectedDriver?.license_number})? This action will remove the record from logs.
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
                {formSubmitting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        ) : modalMode === 'view' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Driver ID</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block">#{selectedDriver?.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Full Name</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block">{selectedDriver?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">License Number</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">{selectedDriver?.license_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">License Category</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">{selectedDriver?.license_category || 'Heavy Transport'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">License Expiry Date</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">
                  {selectedDriver?.license_expiry_date 
                    ? new Date(selectedDriver.license_expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '--'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Safety Score</span>
                <span className="text-slate-850 text-sm font-bold mt-1 block text-emerald-600">{selectedDriver?.safety_score}%</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Phone / Contact</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">{selectedDriver?.contact_number || '--'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Current Status</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block uppercase">{selectedDriver?.status}</span>
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
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Name</label>
                <input required placeholder="David Driver" value={driverName} onChange={e => setDriverName(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">License Number</label>
                <input required placeholder="DL-87654321" value={licenseNum} onChange={e => setLicenseNum(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contact Number</label>
                <input placeholder="9876543210" value={contactNum} onChange={e => setContactNum(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              {modalMode === 'edit' && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Driver Status</label>
                  <select value={driverStatus} onChange={e => setDriverStatus(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                    <option>Available</option>
                    <option>On Trip</option>
                    <option>Off Duty</option>
                    <option>Suspended</option>
                  </select>
                </div>
              )}
            </div>

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
