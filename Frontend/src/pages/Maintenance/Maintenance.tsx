import React, { useState } from 'react';
import { Breadcrumb, Table } from '../../components/Tables/Tables';
import { SearchBar, FilterPlaceholder } from '../../components/Forms/Forms';
import { Modal } from '../../components/Modal/Modal';
import { FiPlus } from 'react-icons/fi';

export const Maintenance: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [filterVal, setFilterVal] = useState('All Statuses');

  const breadcrumbItems = [
    { label: 'TransitOps', href: '/' },
    { label: 'Maintenance', active: true }
  ];

  const columns = [
    { header: 'Record ID', accessor: 'recordId' },
    { header: 'Vehicle', accessor: 'vehicle' },
    { header: 'Service Type', accessor: 'serviceType' },
    { header: 'Status', accessor: 'status' },
    { header: 'Due Date', accessor: 'dueDate' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumb items={breadcrumbItems} />
          <h2 className="text-xl font-bold text-slate-800">Service Schedules</h2>
        </div>
        <button
          onClick={() => setModalOpen(true)}
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
          onChange={setSearchVal}
        />
        <FilterPlaceholder 
          options={['All Statuses', 'Pending', 'In Progress', 'Completed', 'Overdue']}
          selected={filterVal}
          onSelect={setFilterVal}
        />
      </div>

      {/* Empty Table */}
      <Table
        columns={columns}
        emptyStateTitle="No service logs available"
        emptyStateDescription="Schedule safety inspections, mechanical maintenance, or active repairs to prevent operations downtime."
        actionLabel="Schedule Service"
        onActionClick={() => setModalOpen(true)}
      />

      {/* Schedule Maintenance Modal Placeholder */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Service Task">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Define task category, mechanical logs, vehicle identification numbers, and estimated time metrics.
          </p>
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="w-full h-8 bg-slate-200 rounded animate-pulse"></div>
            <div className="w-5/6 h-8 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button 
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
