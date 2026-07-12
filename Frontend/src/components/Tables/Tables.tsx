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
      bg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-950/20';
    } else if (['in maintenance', 'in shop', 'pending approval', 'in transit', 'pending', 'draft', 'scheduled', 'on duty', 'dispatched'].includes(status)) {
      bg = 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-950/20';
    } else if (['suspended', 'retired', 'rejected', 'overdue', 'cancelled', 'inactive', 'out of service', 'off duty'].includes(status)) {
      bg = 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-950/20';
    } else if (['on trip'].includes(status)) {
      bg = 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm shadow-sky-950/20';
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
    <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">
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
                  className="border-b border-slate-800/60 hover:bg-slate-800/25 transition duration-150"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-3.5 text-sm text-slate-300 font-medium">
                      {renderCell(item, col)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {onView && (
                          <button
                            onClick={() => onView(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition duration-150"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition duration-150"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition duration-150"
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
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 text-slate-400">
        <div className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-200">{startIndex}</span> to{' '}
          <span className="font-semibold text-slate-200">{endIndex}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalEntries}</span> entries
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1 || loading}
            className={`p-2 border border-slate-800 rounded-xl transition duration-150 ${
              page <= 1 || loading
                ? 'text-slate-500 bg-slate-950/40 border-slate-900/60 cursor-not-allowed'
                : 'text-slate-300 bg-slate-955 hover:bg-slate-800 hover:text-white border-slate-700'
            }`}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages || loading}
            className={`p-2 border border-slate-800 rounded-xl transition duration-150 ${
              page >= totalPages || loading
                ? 'text-slate-500 bg-slate-955/40 border-slate-900/60 cursor-not-allowed'
                : 'text-slate-300 bg-slate-955 hover:bg-slate-800 hover:text-white border-slate-700'
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
    <nav className="flex mb-4 text-xs font-semibold text-slate-500">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, idx) => (
          <li key={idx} className="inline-flex items-center">
            {idx > 0 && <span className="mx-2 text-slate-800">/</span>}
            {item.active ? (
              <span className="text-slate-300">{item.label}</span>
            ) : (
              <a href={item.href || '#'} className="hover:text-rose-500 transition-colors text-slate-500">
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
