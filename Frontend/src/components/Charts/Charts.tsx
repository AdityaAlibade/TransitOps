import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { FiBarChart2 } from 'react-icons/fi';

interface ChartContainerProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const EmptyChartPlaceholder: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-[1px] p-6 text-center">
      <div className="p-3 bg-slate-100/70 text-slate-400 rounded-2xl mb-2">
        <FiBarChart2 className="w-8 h-8" />
      </div>
      <h4 className="text-sm font-semibold text-slate-700">No chart data available</h4>
      <p className="text-xs text-slate-400 max-w-xs mt-1">
        Charts will dynamically display analytics metrics once trip records are synchronized.
      </p>
    </div>
  );
};

export const EmptyChart: React.FC<ChartContainerProps> = ({ title, description }) => {
  // Empty data structured just to render grid/axis lines in recharts
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
