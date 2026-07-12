import React from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = 'Search...', 
  value = '', 
  onChange 
}) => {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <FiSearch className="w-5 h-5" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="block w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
      />
    </div>
  );
};

interface FilterPlaceholderProps {
  options?: string[];
  selected?: string;
  onSelect?: (val: string) => void;
}

export const FilterPlaceholder: React.FC<FilterPlaceholderProps> = ({
  options = ['All Statuses', 'Active', 'Pending', 'Inactive'],
  selected,
  onSelect
}) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="p-2 text-slate-400 bg-slate-50 border border-slate-200 rounded-xl">
        <FiFilter className="w-4 h-4" />
      </div>
      <select
        value={selected}
        onChange={(e) => onSelect?.(e.target.value)}
        className="block px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};
