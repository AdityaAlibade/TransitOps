import React, { useState } from 'react';
import { WelcomeCard, KPICard } from '../../components/Cards/Cards';
import { EmptyChart } from '../../components/Charts/Charts';
import { Modal } from '../../components/Modal/Modal';
import { 
  FiTruck, 
  FiMapPin, 
  FiUsers, 
  FiTool, 
  FiPlus 
} from 'react-icons/fi';

export const Dashboard: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const triggerQuickAction = (actionName: string) => {
    setModalTitle(actionName);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <WelcomeCard />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Vehicles"
          value="--"
          icon={FiTruck}
          change="0.0%"
          trend="up"
          color="blue"
        />
        <KPICard
          title="Active Trips"
          value="--"
          icon={FiMapPin}
          change="0.0%"
          trend="up"
          color="green"
        />
        <KPICard
          title="Drivers Active"
          value="--"
          icon={FiUsers}
          change="0.0%"
          trend="down"
          color="purple"
        />
        <KPICard
          title="Maintenance Due"
          value="--"
          icon={FiTool}
          change="0.0%"
          trend="up"
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmptyChart 
          title="Trip Performance Overview" 
          description="Monitors successful completions and active dispatches over time"
        />
        <EmptyChart 
          title="Operating Expenses Trends" 
          description="Aggregates monthly fuel, repairs, and miscellaneous costs"
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
          
          <div className="relative border-l border-slate-100 pl-4 space-y-6 min-h-[200px] flex flex-col justify-center">
            <div className="text-center py-8">
              <span className="text-sm font-medium text-slate-400">No activity logs recorded</span>
              <p className="text-xs text-slate-300 mt-1">Vehicle telemetry events will display here in real-time.</p>
            </div>
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
                <span className="text-xs font-semibold">New Vehicle</span>
              </button>
              <button
                onClick={() => triggerQuickAction('Register New Driver')}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 rounded-xl transition duration-200 group text-slate-600"
              >
                <FiUsers className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">New Driver</span>
              </button>
              <button
                onClick={() => triggerQuickAction('Dispatch New Trip')}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 rounded-xl transition duration-200 group text-slate-600"
              >
                <FiMapPin className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Dispatch Trip</span>
              </button>
              <button
                onClick={() => triggerQuickAction('Schedule Maintenance')}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 rounded-xl transition duration-200 group text-slate-600"
              >
                <FiTool className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Schedule Repair</span>
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

      {/* Quick Action Modal Placeholder */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            This is a modular form placeholder for the **{modalTitle}** action.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-xs text-slate-400 block mb-2">Form Elements (Placeholder)</span>
            <div className="w-full h-8 bg-slate-200 rounded animate-pulse mb-2"></div>
            <div className="w-3/4 h-8 bg-slate-200 rounded animate-pulse"></div>
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
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
