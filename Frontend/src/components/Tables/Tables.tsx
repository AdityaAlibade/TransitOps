import React from 'react';
import { EmptyState } from '../EmptyState/EmptyState';
import { FiChevronLeft, FiChevronRight, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { Loader } from '../Loader/Loader';

interface Column {
  header: string;
  accessor: string;
}

interface TableProps {
  columns: Column[];
  data?: any[];
  loading?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  onActionClick?: () => void;
  actionLabel?: string;
  
  // Actions
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  
  // Pagination
  page?: number;
  totalPages?: number;
  pageSize?: number;
  totalEntries?: number;
  onPageChange?: (page: number) => void;
}

const getNestedValue = (obj: any, path: string): any => {
  if (!obj) return '';
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const Table: React.FC<TableProps> = ({
  columns,
  data = [],
  loading = false,
  emptyStateTitle,
  emptyStateDescription,
  onActionClick,
  actionLabel,
  onEdit,
  onDelete,
  onView,
  page = 1,
  totalPages = 1,
  pageSize = 10,
  totalEntries = 0,
  onPageChange
}) => {
  const hasActions = !!onEdit || !!onDelete || !!onView;

  const renderStatusBadge = (val: string) => {
    const status = String(val).trim().toLowerCase();
    let bg = 'bg-slate-50 text-slate-600 border border-slate-100';
    
    if (['available', 'active', 'paid', 'approved', 'completed'].includes(status)) {
      bg = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    } else if (['in maintenance', 'in shop', 'pending approval', 'in transit', 'pending', 'draft', 'scheduled', 'on duty', 'dispatched'].includes(status)) {
      bg = 'bg-amber-50 text-amber-700 border border-amber-100';
    } else if (['suspended', 'retired', 'rejected', 'overdue', 'cancelled', 'inactive', 'out of service', 'off duty'].includes(status)) {
      bg = 'bg-rose-50 text-rose-700 border border-rose-100';
    } else if (['on trip'].includes(status)) {
      bg = 'bg-blue-50 text-blue-700 border border-blue-100';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${bg}`}>
        {val}
      </span>
    );
  };

  const renderCell = (item: any, col: Column) => {
    const val = getNestedValue(item, col.accessor);
    
    if (col.accessor.toLowerCase() === 'status') {
      return renderStatusBadge(val);
    }
    
    if (typeof val === 'object' && val !== null) {
      return val.name || val.registration_number || JSON.stringify(val);
    }

    // Format currency for cost/amount
    if ((col.accessor.toLowerCase().includes('cost') || col.accessor.toLowerCase().includes('amount')) && typeof val === 'number') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    }

    // Format date
    if ((col.accessor.toLowerCase().includes('date') || col.accessor.toLowerCase().includes('expiry') || col.accessor.toLowerCase().includes('created')) && val) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      } catch {}
    }

    return val === null || val === undefined ? '--' : String(val);
  };

  // Compute pagination text indices
  const startIndex = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalEntries);

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
              {hasActions && (
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="p-8 text-center">
                  <Loader />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="p-8">
                  <EmptyState 
                    title={emptyStateTitle}
                    description={emptyStateDescription}
                    actionLabel={actionLabel}
                    onAction={onActionClick}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr 
                  key={item.id || rowIdx} 
                  className="border-b border-slate-50 hover:bg-slate-50/40 transition duration-150"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-3.5 text-sm text-slate-600">
                      {renderCell(item, col)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {onView && (
                          <button
                            onClick={() => onView(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-150"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition duration-150"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition duration-150"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
        <div className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{startIndex}</span> to{' '}
          <span className="font-medium text-slate-900">{endIndex}</span> of{' '}
          <span className="font-medium text-slate-900">{totalEntries}</span> entries
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1 || loading}
            className={`p-2 border border-slate-200 rounded-xl transition duration-150 ${
              page <= 1 || loading
                ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                : 'text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages || loading}
            className={`p-2 border border-slate-200 rounded-xl transition duration-150 ${
              page >= totalPages || loading
                ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                : 'text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800'
            }`}
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
