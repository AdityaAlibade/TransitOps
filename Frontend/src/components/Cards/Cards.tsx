import React from 'react';
import type { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

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
      bg: 'bg-slate-900/60',
      text: 'text-rose-500',
      iconBg: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm shadow-rose-950/20'
    },
    green: {
      bg: 'bg-slate-900/60',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-950/20'
    },
    orange: {
      bg: 'bg-slate-900/60',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-950/20'
    },
    purple: {
      bg: 'bg-slate-900/60',
      text: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-950/20'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="flex items-center justify-between p-6 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-lg hover:shadow-xl hover:border-slate-700/80 transition-all duration-300">
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
        <h3 className="text-3xl font-extrabold text-slate-100">{value}</h3>
        {change && (
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            {trend === 'up' ? (
              <FiTrendingUp className="text-emerald-400 w-3.5 h-3.5" />
            ) : (
              <FiTrendingDown className="text-rose-400 w-3.5 h-3.5" />
            )}
            <span className={trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}>{change}</span>
            <span className="text-slate-500">vs last month</span>
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
  const { user } = useAuth();
  const userName = user?.name || 'Admin';

  return (
    <div className="relative overflow-hidden p-6 md:p-8 bg-slate-900 border border-slate-800/80 rounded-3xl text-white shadow-xl min-h-[180px] flex items-center">
      {/* Background image overlay with gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 md:opacity-40 pointer-events-none md:bg-right"
        style={{ backgroundImage: "url('/logistics_hero.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-xl space-y-3">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          {greeting}, {userName}!
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed font-medium">
          Welcome to the TransitOps control tower. Track vehicles, manage driver performance, monitor dispatch workflows, and review operations logs from a unified hub.
        </p>
        <div className="pt-1">
          <span className="inline-flex items-center px-3 py-1 bg-emerald-500/10 backdrop-blur-md rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-wide border border-emerald-500/20">
            System status: nominal
          </span>
        </div>
      </div>
    </div>
  );
};
