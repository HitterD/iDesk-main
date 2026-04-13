import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface FiltersState {
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    siteId?: string;
}

interface ExtendedFiltersProps {
    filters: FiltersState;
    onFilterChange: (filters: FiltersState) => void;
}

export const ExtendedFilters: React.FC<ExtendedFiltersProps> = ({ filters, onFilterChange }) => {
    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(localSearch, 500);

    const handleFilterUpdate = (key: keyof FiltersState, value: string | undefined) => {
        onFilterChange({ ...filters, [key]: value });
    };

    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            handleFilterUpdate('search', debouncedSearch || undefined);
        }
    }, [debouncedSearch]);

    const statuses = [
        { id: '', label: 'All Requests' },
        { id: 'PENDING', label: 'Scheduled' },
        { id: 'IN_PROGRESS', label: 'In Progress' },
        { id: 'RESOLVED', label: 'Completed' },
    ];

    const hasActiveFilters = !!filters.startDate || !!filters.endDate || !!filters.search || !!filters.siteId || !!filters.status;

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center">
            
            {/* Search Bar */}
            <div className="relative flex-grow w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                <input
                    type="text"
                    placeholder="Search tickets by title or ID..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl text-sm font-medium text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out placeholder:opacity-50 shadow-sm"
                />
            </div>

            {/* Status Pills */}
            <div className="flex bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-1 shadow-sm overflow-x-auto custom-scrollbar">
                {statuses.map(status => {
                    const isActive = (filters.status || '') === status.id;
                    return (
                        <button
                            key={status.id}
                            onClick={() => handleFilterUpdate('status', status.id || undefined)}
                            className={`px-4 py-2.5 outline-none rounded-lg text-xs font-bold whitespace-nowrap transition-colors duration-150 ${
                                isActive
                                    ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            {status.label}
                        </button>
                    );
                })}
            </div>

            {/* Date Filters */}
            <div className="flex bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-1 shadow-sm items-center">
                <div className="flex items-center px-3 py-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <input 
                        type="date" 
                        value={filters.startDate || ''}
                        onChange={(e) => handleFilterUpdate('startDate', e.target.value || undefined)}
                        className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 outline-none w-28 date-input-no-icon text-[hsl(var(--foreground))]"
                    />
                    <span className="mx-2 text-muted-foreground/50">-</span>
                    <input 
                        type="date" 
                        value={filters.endDate || ''}
                        onChange={(e) => handleFilterUpdate('endDate', e.target.value || undefined)}
                        className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 outline-none w-28 date-input-no-icon text-[hsl(var(--foreground))]"
                    />
                </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
                <button
                    onClick={() => {
                        setLocalSearch('');
                        onFilterChange({});
                    }}
                    className="p-3 bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/20 rounded-xl transition-colors border border-[hsl(var(--destructive))]/20 flex items-center justify-center shrink-0"
                    title="Clear Filters"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            <style>{`
                .date-input-no-icon::-webkit-calendar-picker-indicator {
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    cursor: pointer;
                }
                .date-input-no-icon {
                    position: relative;
                }
            `}</style>
        </div>
    );
};