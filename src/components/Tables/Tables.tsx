import React from 'react';
import { EmptyState } from '../EmptyState/EmptyState';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Column {
  header: string;
  accessor: string;
}

interface TableProps {
  columns: Column[];
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  onActionClick?: () => void;
  actionLabel?: string;
}

export const Table: React.FC<TableProps> = ({
  columns,
  emptyStateTitle,
  emptyStateDescription,
  onActionClick,
  actionLabel
}) => {
  return (
    <div className="w-full bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="p-8">
                <EmptyState 
                  title={emptyStateTitle}
                  description={emptyStateDescription}
                  actionLabel={actionLabel}
                  onAction={onActionClick}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Pagination Placeholder */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
        <div className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">0</span> to{' '}
          <span className="font-medium text-slate-900">0</span> of{' '}
          <span className="font-medium text-slate-900">0</span> entries
        </div>
        <div className="flex space-x-2">
          <button 
            disabled 
            className="p-2 border border-slate-200 text-slate-400 bg-slate-50 rounded-xl cursor-not-allowed transition duration-150"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button 
            disabled 
            className="p-2 border border-slate-200 text-slate-400 bg-slate-50 rounded-xl cursor-not-allowed transition duration-150"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex mb-4 text-xs font-medium text-slate-400">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, idx) => (
          <li key={idx} className="inline-flex items-center">
            {idx > 0 && <span className="mx-2 text-slate-300">/</span>}
            {item.active ? (
              <span className="text-slate-600">{item.label}</span>
            ) : (
              <a href={item.href || '#'} className="hover:text-blue-600 transition-colors">
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
