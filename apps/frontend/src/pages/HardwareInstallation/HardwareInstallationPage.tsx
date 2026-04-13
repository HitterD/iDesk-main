import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCards } from '../../components/HardwareInstallation/StatsCards';
import { ExtendedFilters } from '../../components/HardwareInstallation/ExtendedFilters';
import { InstallationCalendar } from '../../components/HardwareInstallation/InstallationCalendar';
import { useHardwareStats, useHardwareTickets, useAllHardwareTickets, HardwareInstallationFilters } from '../../hooks/useHardwareInstallation';
import { Wrench, MonitorSmartphone, MapPin, User, ChevronRight, Clock, Package } from 'lucide-react';
import { useAuth } from '@/stores/useAuth';

const HardwareInstallationPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAgent = ['ADMIN', 'MANAGER', 'AGENT', 'AGENT_OPERATIONAL_SUPPORT', 'AGENT_ADMIN', 'AGENT_ORACLE'].includes(user?.role || '');

    const [filters, setFilters] = useState<HardwareInstallationFilters>({
        page: 1,
        limit: 10
    });
    
    // Separate selected date for calendar filter
    const [selectedDate, setSelectedDate] = useState<string | undefined>();

    // Pass everything including date to the hook
    const activeFilters = {
        ...filters,
        startDate: selectedDate ? selectedDate : filters.startDate,
        endDate: selectedDate ? selectedDate : filters.endDate,
    };

    const { data: statsData, isLoading: isStatsLoading } = useHardwareStats();
    const { data: ticketResponse, isLoading: isTicketsLoading } = useHardwareTickets(activeFilters);

    // Get the generic calendar tickets without pagination to show dots correctly
    const { data: allTicketsResponse } = useAllHardwareTickets({});

    const tickets = ticketResponse?.data || [];
    const allTicketsList = allTicketsResponse?.data || [];
    const meta = {
        total: ticketResponse?.total || 0,
        page: ticketResponse?.page || 1,
        limit: ticketResponse?.limit || 10,
        totalPages: ticketResponse?.totalPages || 1
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= (meta.totalPages || 1)) {
            setFilters(prev => ({ ...prev, page: newPage }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-[hsl(var(--border))]">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[10px] font-extrabold uppercase tracking-widest mb-1 shadow-sm">
                        <Wrench className="w-3 h-3" />
                        System Operations
                    </div>
                    <h1 className="text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tighter flex items-center gap-4 uppercase">
                        Installation Management
                    </h1>
                    <p className="text-muted-foreground text-xs font-medium opacity-70">
                        Tracking, Scheduling, and Operations for Hardware Deployment.
                    </p>
                </div>
            </div>

            {/* Top Stat Cards */}
            <StatsCards 
                stats={statsData ? {
                    total: statsData.total,
                    pending: statsData.todo,
                    inProgress: statsData.inProgress,
                    completed: statsData.resolved
                } : undefined} 
                isLoading={isStatsLoading} 
            />
            
            {/* Extended Filters Bar */}
            <ExtendedFilters 
                filters={filters as any} 
                onFilterChange={(newFilters) => setFilters({ ...newFilters, page: 1 } as any)} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Table Column */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[hsl(var(--border))] bg-muted/20 flex items-center justify-between">
                            <h3 className="font-extrabold text-[hsl(var(--foreground))] uppercase tracking-widest flex items-center gap-2 text-xs">
                                <Package className="w-4 h-4 text-[hsl(var(--primary))]" /> 
                                Installation Queue
                            </h3>
                            <span className="text-[10px] font-extrabold text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 rounded-lg px-2 py-0.5">
                                {meta.total} {meta.total === 1 ? 'Record' : 'Records'}
                            </span>
                        </div>

                        {isTicketsLoading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-20 bg-muted rounded-xl animate-pulse w-full"></div>
                                ))}
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center bg-[hsl(var(--card))]">
                                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-6 text-muted-foreground/30 border border-border/50">
                                    <MonitorSmartphone className="w-8 h-8" />
                                </div>
                                <h4 className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight mb-2">No Records Found</h4>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-70">
                                    Adjust search parameters or date boundaries.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col flex-1">
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[hsl(var(--border))] text-xs font-semibold text-muted-foreground tracking-wider bg-muted/10">
                                    <div className="col-span-2">ID & Status</div>
                                    <div className="col-span-5">Details</div>
                                    <div className="col-span-3">Assigned & Location</div>
                                    <div className="col-span-2 text-right">Target Date</div>
                                </div>
                                
                                <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
                                    {tickets.map((ticket, idx) => (
                                        <div 
                                            key={ticket.id} 
                                            onClick={() => navigate(isAgent ? `/hardware-installation/${ticket.id}` : `/client/hardware-installation/${ticket.id}`)}
                                            className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transition-colors hover:bg-muted/50 group"
                                        >
                                            <div className="col-span-2 flex flex-col gap-1.5 align-start">
                                                <span className="text-[10px] font-extrabold text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 px-2 py-0.5 rounded-md w-max">
                                                    #{ticket.ticketNumber || ticket.id.substring(0, 8)}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md w-max border ${
                                                    ticket.status === 'TODO' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    ticket.status === 'RESOLVED' ? 'bg-[hsl(var(--success-500))]/10 text-[hsl(var(--success-500))] border-[hsl(var(--success-500))]/20' :
                                                    'bg-muted text-muted-foreground border-[hsl(var(--border))]'
                                                }`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            
                                            <div className="col-span-5 flex flex-col">
                                                <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] truncate group-hover:text-[hsl(var(--primary))] transition-colors">
                                                    {ticket.title || ticket.itemName || 'Hardware Installation'}
                                                </h4>
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                                                    {ticket.requester && (
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {ticket.requester.fullName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="col-span-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <Wrench className="w-3 h-3 text-[hsl(var(--primary))]" />
                                                    {ticket.assignedTo?.fullName || 'Unassigned'}
                                                </span>
                                                {ticket.site && (
                                                    <span className="flex items-center gap-1.5 text-[10px]">
                                                        <MapPin className="w-3 h-3" />
                                                        {ticket.site.name}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="col-span-2 flex items-center justify-end gap-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                                        <span className={ticket.status === 'TODO' ? 'text-[hsl(var(--foreground))]' : 'text-muted-foreground'}>
                                                            {ticket.scheduledDate ? new Date(ticket.scheduledDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBA'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Pagination Area */}
                        {meta.totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex items-center justify-between bg-muted/10">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Page {meta.page} of {meta.totalPages}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        disabled={meta.page <= 1}
                                        onClick={() => handlePageChange((meta as any).page - 1)}
                                        className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs font-semibold hover:bg-muted disabled:opacity-30 disabled:hover:bg-[hsl(var(--background))] transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button 
                                        disabled={meta.page >= meta.totalPages}
                                        onClick={() => handlePageChange((meta as any).page + 1)}
                                        className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs font-semibold hover:bg-muted disabled:opacity-30 disabled:hover:bg-[hsl(var(--background))] transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Calendar */}
                <div className="lg:col-span-4 lg:sticky lg:top-8">
                    <InstallationCalendar 
                        tickets={allTicketsList} 
                        isLoading={isTicketsLoading && allTicketsList.length === 0} 
                        onDateSelect={setSelectedDate}
                        selectedDateStr={selectedDate}
                    />
                </div>
            </div>
        </div>
    );
};

export default HardwareInstallationPage;