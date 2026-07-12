import React from 'react';
import type { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: IconType;
  change?: string;
  trend?: 'up' | 'down';
  color?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  trend,
  color = 'blue'
}) => {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: {
      bg: 'bg-white',
      text: 'text-blue-600',
      iconBg: 'bg-blue-50 text-blue-600'
    },
    green: {
      bg: 'bg-white',
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600'
    },
    orange: {
      bg: 'bg-white',
      text: 'text-orange-600',
      iconBg: 'bg-orange-50 text-orange-600'
    },
    purple: {
      bg: 'bg-white',
      text: 'text-purple-600',
      iconBg: 'bg-purple-50 text-purple-600'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300">
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        {change && (
          <div className="flex items-center space-x-1.5 text-xs font-medium">
            {trend === 'up' ? (
              <FiTrendingUp className="text-emerald-500 w-3.5 h-3.5" />
            ) : (
              <FiTrendingDown className="text-rose-500 w-3.5 h-3.5" />
            )}
            <span className={trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}>{change}</span>
            <span className="text-slate-400">vs last month</span>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-2xl ${scheme.iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export const WelcomeCard: React.FC = () => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 rounded-3xl text-white shadow-lg shadow-blue-100">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-10 -mb-20 blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-xl space-y-3">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {greeting}, Admin!
        </h2>
        <p className="text-blue-50/90 text-sm md:text-base leading-relaxed font-medium">
          Welcome to the **TransitOps** control tower. Track vehicles, manage driver performance, monitor dispatch workflows, and review operations logs from a unified hub.
        </p>
        <div className="pt-2">
          <span className="inline-flex items-center px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-white/95 uppercase tracking-wide border border-white/10">
            System status: nominal
          </span>
        </div>
      </div>
    </div>
  );
};
