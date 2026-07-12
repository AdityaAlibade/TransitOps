import React, { useState, useEffect } from 'react';
import { Breadcrumb, Table } from '../../components/Tables/Tables';
import { SearchBar, FilterPlaceholder } from '../../components/Forms/Forms';
import { Modal } from '../../components/Modal/Modal';
import { api } from '../../services/api';
import { FiPlus, FiAlertTriangle } from 'react-icons/fi';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
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
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | 'view'>('add');
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Form Fields
  const [vehicleId, setVehicleId] = useState('');
  const [tripId, setTripId] = useState('');
  const [expenseType, setExpenseType] = useState('Fuel');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [description, setDescription] = useState('');

  // Submit Feedback
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const breadcrumbItems = [
    { label: 'TransitOps', href: '/' },
    { label: 'Expenses', active: true }
  ];

  const columns = [
    { header: 'Expense ID', accessor: 'id' },
    { header: 'Category', accessor: 'expense_type' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Date', accessor: 'expense_date' },
    { header: 'Vehicle Plate', accessor: 'vehicle.registration_number' },
    { header: 'Status', accessor: 'status' }
  ];

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/expenses');
      // Format data: append a status field "Paid" for the table badge
      const formatted = (res.data.data || []).map((exp: any) => ({
        ...exp,
        status: 'Paid'
      }));
      setExpenses(formatted);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch operating expense logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const vRes = await api.get('/vehicles');
      setVehicles(vRes.data.data || []);

      const tRes = await api.get('/trips');
      setTrips(tRes.data.data || []);
    } catch (err) {
      console.error('Failed loading resources dropdowns:', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filter & Search application
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = 
      exp.expense_type.toLowerCase().includes(searchVal.toLowerCase()) ||
      (exp.description && exp.description.toLowerCase().includes(searchVal.toLowerCase())) ||
      (exp.vehicle?.registration_number && exp.vehicle.registration_number.toLowerCase().includes(searchVal.toLowerCase())) ||
      String(exp.id).includes(searchVal);

    const matchesType = 
      filterVal === 'All Statuses' || 
      exp.expense_type.toLowerCase() === filterVal.toLowerCase() ||
      (filterVal === 'Paid' && exp.status === 'Paid');

    return matchesSearch && matchesType;
  });

  // Pagination calculation
  const totalEntries = filteredExpenses.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedData = filteredExpenses.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const handleOpenAddModal = async () => {
    setModalMode('add');
    setVehicleId('');
    setTripId('');
    setExpenseType('Fuel');
    setAmount('');
    setExpenseDate('');
    setDescription('');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
    await fetchResources();
  };

  const handleOpenEditModal = async (item: any) => {
    setModalMode('edit');
    setSelectedExpense(item);
    setVehicleId(item.vehicle_id ? String(item.vehicle_id) : '');
    setTripId(item.trip_id ? String(item.trip_id) : '');
    setExpenseType(item.expense_type);
    setAmount(String(item.amount));
    
    if (item.expense_date) {
      const d = new Date(item.expense_date);
      if (!isNaN(d.getTime())) {
        setExpenseDate(d.toISOString().split('T')[0]);
      }
    } else {
      setExpenseDate('');
    }
    
    setDescription(item.description || '');
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
    await fetchResources();
  };

  const handleOpenDeleteModal = (item: any) => {
    setModalMode('delete');
    setSelectedExpense(item);
    setFormError(null);
    setFormSuccess(null);
    setModalOpen(true);
  };

  const handleOpenViewModal = (item: any) => {
    setModalMode('view');
    setSelectedExpense(item);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormSubmitting(true);

    try {
      const payload = {
        vehicle_id: vehicleId ? Number(vehicleId) : undefined,
        trip_id: tripId ? Number(tripId) : undefined,
        expense_type: expenseType,
        amount: Number(amount),
        expense_date: new Date(expenseDate).toISOString(),
        description: description || undefined
      };

      if (modalMode === 'add') {
        await api.post('/expenses', payload);
        setFormSuccess('Expense logged successfully!');
      } else if (modalMode === 'edit') {
        await api.put(`/expenses/${selectedExpense.id}`, payload);
        setFormSuccess('Expense record updated successfully!');
      }

      await fetchExpenses();
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
      await api.delete(`/expenses/${selectedExpense.id}`);
      setFormSuccess('Expense record deleted successfully!');
      await fetchExpenses();
      setTimeout(() => setModalOpen(false), 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete expense log.');
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
          <h2 className="text-xl font-bold text-slate-800">Finance & Expenses</h2>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition duration-150 shadow-sm shadow-blue-200"
        >
          <FiPlus className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <SearchBar 
          placeholder="Search categories, plate numbers..." 
          value={searchVal}
          onChange={(val) => {
            setSearchVal(val);
            setPage(1);
          }}
        />
        <FilterPlaceholder 
          options={['All Statuses', 'Fuel', 'Maintenance', 'Toll', 'Other', 'Paid']}
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

      {/* Expenses Table */}
      <Table
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyStateTitle="No expense reports logged"
        emptyStateDescription="Document fuel purchases, road tolls, driver payouts, and maintenance invoices to compute total operating expense parameters."
        actionLabel="Log Expense"
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
            ? 'Log Operating Cost' 
            : modalMode === 'edit'
              ? 'Edit Expense Details'
              : modalMode === 'delete'
                ? 'Delete Expense Entry'
                : 'Expense Details'
        }
      >
        {modalMode === 'delete' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Are you sure you want to permanently delete expense entry **#{selectedExpense?.id}** for ₹{selectedExpense?.amount}?
            </p>
            {formError && <p className="text-xs text-rose-600 font-semibold">{formError}</p>}
            {formSuccess && <p className="text-xs text-emerald-600 font-semibold">{formSuccess}</p>}
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button type="button" disabled={formSubmitting} onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button type="button" disabled={formSubmitting} onClick={handleDeleteConfirm} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition">
                {formSubmitting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        ) : modalMode === 'view' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Expense ID</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block">#{selectedExpense?.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Category / Type</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block">{selectedExpense?.expense_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Total Amount</span>
                <span className="text-slate-800 text-sm font-bold mt-1 block text-rose-600">₹{Number(selectedExpense?.amount).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Log Date</span>
                <span className="text-slate-800 text-sm font-semibold mt-1 block">
                  {selectedExpense?.expense_date ? new Date(selectedExpense.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Associated Vehicle</span>
                <span className="text-slate-800 text-xs font-semibold mt-1 block">
                  {selectedExpense?.vehicle ? `${selectedExpense.vehicle.registration_number} (${selectedExpense.vehicle.name_model})` : 'General / Fleet'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Associated Trip ID</span>
                <span className="text-slate-800 text-xs font-semibold mt-1 block">{selectedExpense?.trip_id ? `#${selectedExpense.trip_id}` : 'General Operation'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">Description / Notes</span>
                <span className="text-slate-800 text-xs font-medium mt-1 block bg-white p-2 border border-slate-100 rounded-lg">{selectedExpense?.description || 'No description recorded'}</span>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs">{formSuccess}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Expense Type</label>
                <select value={expenseType} onChange={e => setExpenseType(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option>Fuel</option>
                  <option>Toll</option>
                  <option>Maintenance</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Amount (₹)</label>
                <input required type="number" min="1" placeholder="4500" value={amount} onChange={e => setAmount(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vehicle (Optional)</label>
                <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option value="">General Operation / None</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number} ({v.name_model})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Trip ID (Optional)</label>
                <select value={tripId} onChange={e => setTripId(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option value="">General Operation / None</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>Trip #{t.id} ({t.source} to {t.destination})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Log Date</label>
                <input required type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description / Notes</label>
                <input placeholder="Receipt invoice description..." value={description} onChange={e => setDescription(e.target.value)} className="block w-full border border-slate-200 text-slate-700 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button type="button" disabled={formSubmitting} onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
              <button type="submit" disabled={formSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
