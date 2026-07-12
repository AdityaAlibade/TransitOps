import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Area
} from 'recharts';
import { FiBarChart2 } from 'react-icons/fi';
import { Loader } from '../Loader/Loader';

interface ChartContainerProps {
  title: string;
  description?: string;
  loading?: boolean;
  data?: any[];
}

const EmptyChartPlaceholder: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/55 backdrop-blur-[1px] p-6 text-center">
      <div className="p-3 bg-slate-100/70 text-slate-400 rounded-2xl mb-2">
        <FiBarChart2 className="w-8 h-8" />
      </div>
      <h4 className="text-sm font-semibold text-slate-700">No chart data available</h4>
      <p className="text-xs text-slate-400 max-w-xs mt-1">
        Charts will dynamically display analytics metrics once logs are synchronized.
      </p>
    </div>
  );
};

export const EmptyChart: React.FC<ChartContainerProps> = ({ title, description }) => {
  const dummyGridData = [
    { name: 'Jan', value: 0 },
    { name: 'Feb', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Apr', value: 0 },
    { name: 'May', value: 0 },
    { name: 'Jun', value: 0 }
  ];

  return (
    <div className="relative flex flex-col p-6 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-[340px]">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      
      <div className="relative flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dummyGridData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              dx={-5}
            />
            <Tooltip cursor={false} />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
        
        <EmptyChartPlaceholder />
      </div>
    </div>
  );
};

export const TripPerformanceChart: React.FC<ChartContainerProps> = ({ title, description, loading = false, data = [] }) => {
  const isEmpty = data.length === 0;

  return (
    <div className="relative flex flex-col p-6 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-[340px]">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      
      <div className="relative flex-1 w-full min-h-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader />
          </div>
        ) : isEmpty ? (
          <>
            <EmptyChart title={title} description={description} />
          </>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                dx={-5}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="Dispatched" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export const OperatingExpensesChart: React.FC<ChartContainerProps> = ({ title, description, loading = false, data = [] }) => {
  const isEmpty = data.length === 0;

  return (
    <div className="relative flex flex-col p-6 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden h-[340px]">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      
      <div className="relative flex-1 w-full min-h-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader />
          </div>
        ) : isEmpty ? (
          <>
            <EmptyChart title={title} description={description} />
          </>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                dx={-5}
              />
              <Tooltip 
                formatter={(value: any) => [`₹${value}`, '']}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="Fuel" stackId="1" stroke="#f59e0b" fill="#fef3c7" opacity={0.6} />
              <Area type="monotone" dataKey="Maintenance" stackId="1" stroke="#ef4444" fill="#fee2e2" opacity={0.6} />
              <Area type="monotone" dataKey="Toll" stackId="1" stroke="#8b5cf6" fill="#ede9fe" opacity={0.6} />
              <Area type="monotone" dataKey="Other" stackId="1" stroke="#64748b" fill="#f1f5f9" opacity={0.6} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
