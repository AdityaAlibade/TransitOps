import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowLeft, FiHome } from 'react-icons/fi';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 p-8 space-y-6 md:p-10">
        
        {/* Animated Warning Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 mb-2">
          <FiAlertTriangle className="w-10 h-10 animate-pulse" />
        </div>
        
        {/* Title and details */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">Access Denied</h2>
          <p className="text-xs text-rose-500 uppercase tracking-widest font-bold">Error Code 403 / Forbidden</p>
        </div>

        <p className="text-sm text-slate-450 leading-relaxed">
          Your account is not authorized to access this module. Granular permissions must be configured and granted by an administrator in the database.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center space-x-2 px-5 py-3 text-sm font-semibold text-slate-650 bg-slate-50 border border-slate-100 hover:bg-slate-100 active:bg-slate-150 rounded-2xl transition duration-150 cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl shadow-md shadow-blue-200 transition duration-150 cursor-pointer"
          >
            <FiHome className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
