import React from 'react';
import { FiFolder } from 'react-icons/fi';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Get started by creating a new entry.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
      <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
        <FiFolder className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition duration-200 shadow-sm shadow-blue-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
