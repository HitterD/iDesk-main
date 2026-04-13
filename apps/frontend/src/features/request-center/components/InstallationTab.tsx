import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIctBudgetInstallations, type InstallationTicket } from '../api/ict-budget.api';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/stores/useAuth';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Scheduled', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'RESOLVED' },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[hsl(var(--success-500))]/10 text-[hsl(var(--success-500))] dark:bg-[hsl(var(--success-500))]/20">
          Completed
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[hsl(var(--info-500))]/10 text-[hsl(var(--info-500))] dark:bg-[hsl(var(--info-500))]/20">
          In Progress
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[hsl(var(--warning-500))]/10 text-[hsl(var(--warning-500))] dark:bg-[hsl(var(--warning-500))]/20">
          Scheduled
        </span>
      );
  }
}

export function InstallationTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: response, isLoading } = useIctBudgetInstallations({
    page,
    limit: 20,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
  });

  const installations = response?.data || [];
  const totalPages = response?.totalPages || 1;
  const total = response?.total || 0;

  const getBasePath = () => {
    if (user?.role === 'MANAGER') return '/manager';
    if (user?.role === 'USER') return '/client';
    return '';
  };

  const handleRowClick = (installation: InstallationTicket) => {
    if (installation.ictBudgetRequestId) {
      navigate(
        `${getBasePath()}/hardware-requests/${installation.ictBudgetRequestId}?highlight=installation`,
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-filters + Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex bg-[hsl(var(--muted))/30 p-1 rounded-xl border border-[hsl(var(--border))] w-full md:w-auto overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-[opacity,transform,colors] duration-200 ease-out whitespace-nowrap ${
                statusFilter === filter.value
                  ? 'bg-[hsl(var(--primary))] text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[hsl(var(--primary))] transition-colors" />
          <input
            type="text"
            placeholder="Search installations..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl text-xs font-medium text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out placeholder:opacity-50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-[hsl(var(--border))]">
                <th className="px-4 py-3 font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Ticket
                </th>
                <th className="px-4 py-3 font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Hardware
                </th>
                <th className="px-4 py-3 font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Site
                </th>
                <th className="px-4 py-3 font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Status
                </th>
                <th className="px-4 py-3 font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Requester
                </th>
                <th className="px-4 py-3 font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Assigned
                </th>
                <th className="px-4 py-3 font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest">
                  Scheduled
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-6 h-6 border-2 border-[hsl(var(--primary))]/30 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
                       <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-50">Loading Installations...</span>
                    </div>
                  </td>
                </tr>
              ) : installations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-50">No installations found</span>
                  </td>
                </tr>
              ) : (
                installations.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="text-[hsl(var(--primary))] text-[10px] font-extrabold tracking-tighter">
                        {item.ticketNumber}
                      </span>
                      <div className="font-bold text-[hsl(var(--foreground))] text-xs truncate max-w-[180px]">
                        {item.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--foreground))] text-xs font-medium">
                      {item.itemName || item.hardwareType || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {item.site ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground border border-[hsl(var(--border))] uppercase tracking-tight">
                          {item.site.name}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3">
                      {item.requester ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[hsl(var(--primary))] text-primary-foreground flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                            {item.requester.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[hsl(var(--foreground))] text-[11px] font-semibold">
                            {item.requester.fullName}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[hsl(var(--success-500))] text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                            {item.assignedTo.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[hsl(var(--foreground))] text-[11px] font-semibold">
                            {item.assignedTo.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[10px] font-extrabold uppercase tracking-widest opacity-40">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.scheduledDate ? (
                        <div>
                          <div className="text-[hsl(var(--foreground))] text-xs font-bold">
                            {new Date(item.scheduledDate).toLocaleDateString(
                              'id-ID',
                              { day: 'numeric', month: 'short', year: 'numeric' },
                            )}
                          </div>
                          {item.scheduledTimeSlot && (
                            <div className="text-muted-foreground text-[10px] font-medium">
                              {item.scheduledTimeSlot}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 px-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground opacity-70">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of{' '}
            {total} installations
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-[hsl(var(--border))] rounded-xl disabled:opacity-30 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 rounded-xl text-[10px] font-extrabold transition-[opacity,transform,colors] duration-200 ease-out border ${
                      page === p
                        ? 'bg-[hsl(var(--primary))] text-primary-foreground border-[hsl(var(--primary))] shadow-sm'
                        : 'text-muted-foreground border-[hsl(var(--border))] hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-[hsl(var(--border))] rounded-xl disabled:opacity-30 hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}