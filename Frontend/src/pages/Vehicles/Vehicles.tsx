import React, { useState } from 'react';
import { Breadcrumb, Table } from '../../components/Tables/Tables';
import { SearchBar, FilterPlaceholder } from '../../components/Forms/Forms';
import { Modal } from '../../components/Modal/Modal';
import { FiPlus } from 'react-icons/fi';

export const Vehicles: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [filterVal, setFilterVal] = useState('All Statuses');

  const breadcrumbItems = [
    { label: 'TransitOps', href: '/' },
    { label: 'Vehicles', active: true }
  ];

  const columns = [
    { header: 'Plate Number', accessor: 'plateNumber' },
    { header: 'Model', accessor: 'model' },
    { header: 'Type', accessor: 'type' },
    { header: 'Status', accessor: 'status' },
    { header: 'Last Active', accessor: 'lastActive' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumb items={breadcrumbItems} />
          <h2 className="text-xl font-bold text-slate-800">Fleet Vehicles</h2>
        </div>
        <button
          onClick={() => setModalOpen(true)}
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
          onChange={setSearchVal}
        />
        <FilterPlaceholder 
          options={['All Statuses', 'Active', 'In Maintenance', 'Available', 'Out of Service']}
          selected={filterVal}
          onSelect={setFilterVal}
        />
      </div>

      {/* Empty Table */}
      <Table
        columns={columns}
        emptyStateTitle="No vehicles registered"
        emptyStateDescription="Get started by registering a vehicle in your active fleet."
        actionLabel="Register Vehicle"
        onActionClick={() => setModalOpen(true)}
      />

      {/* Add Vehicle Modal Placeholder */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register New Vehicle">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Provide the required credentials to register a new vehicle to the TransitOps management console.
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
              Submit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
