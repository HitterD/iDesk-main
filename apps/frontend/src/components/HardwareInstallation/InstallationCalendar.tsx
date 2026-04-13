import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Terminal } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { InstallationTicket } from '../../features/request-center/api/ict-budget.api';

interface InstallationCalendarProps {
    tickets?: InstallationTicket[];
    isLoading?: boolean;
    onDateSelect?: (dateStr: string | undefined) => void;
    selectedDateStr?: string;
}

export const InstallationCalendar: React.FC<InstallationCalendarProps> = ({ 
    tickets = [], 
    isLoading,
    onDateSelect,
    selectedDateStr
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const dailyCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!tickets) return counts;
        
        tickets.forEach(ticket => {
            if (ticket.createdAt) {
                const dateKey = new Date(ticket.createdAt).toISOString().split('T')[0];
                counts[dateKey] = (counts[dateKey] || 0) + 1;
            }
        });
        return counts;
    }, [tickets]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart;
    const endDate = monthEnd;

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const activeDateStr = selectedDateStr || new Date().toISOString().split('T')[0];
    const highlightedTickets = tickets?.filter(t => {
        const d = new Date(t.createdAt).toISOString().split('T')[0];
        return d === activeDateStr;
    }) || [];

    if (isLoading) {
        return (
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-8 animate-pulse shadow-sm">
                <div className="h-6 w-32 bg-[hsl(var(--muted))] mb-6 rounded-full"></div>
                <div className="h-64 bg-[hsl(var(--muted))] rounded-3xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-sm flex flex-col gap-6 h-full sticky top-8">
            
            <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-[hsl(var(--foreground))] uppercase tracking-widest flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-[hsl(var(--primary))]" /> 
                    Schedule
                </h3>
                
                {selectedDateStr && onDateSelect && (
                    <button 
                        onClick={() => onDateSelect(undefined)}
                        className="text-[10px] font-bold text-muted-foreground hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] uppercase tracking-widest transition-colors px-3 py-1 rounded-full border border-[hsl(var(--border))]"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Custom Interactive Calendar */}
            <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-4 shadow-inner">
                {/* Header: Month / Nav */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted hover:bg-[hsl(var(--primary))] hover:text-white transition-colors text-muted-foreground">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="text-sm font-extrabold text-[hsl(var(--foreground))] uppercase tracking-widest">
                        {format(currentDate, 'MMM yyyy')}
                    </div>
                    <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted hover:bg-[hsl(var(--primary))] hover:text-white transition-colors text-muted-foreground">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <div key={`${day}-${idx}`} className="text-center text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Padding for first day */}
                    {Array.from({ length: startDate.getDay() }).map((_, i) => (
                        <div key={`pad-${i}`} className="aspect-square rounded-xl"></div>
                    ))}
                    
                    {calendarDays.map((day) => {
                        const dateStr = day.toISOString().split('T')[0];
                        const count = dailyCounts[dateStr] || 0;
                        const isSelected = selectedDateStr === dateStr;
                        const isCurrentDay = isToday(day);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => onDateSelect && onDateSelect(isSelected ? undefined : dateStr)}
                                className={`
                                    relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-colors duration-150
                                    ${isSelected 
                                        ? 'bg-[hsl(var(--primary))] text-white shadow-md scale-105' 
                                        : isCurrentDay 
                                            ? 'bg-muted text-[hsl(var(--foreground))] hover:bg-muted/80' 
                                            : 'text-muted-foreground hover:bg-[hsl(var(--background))] hover:shadow-sm border border-transparent hover:border-[hsl(var(--border))] hover:text-foreground'
                                    }
                                `}
                            >
                                <span>{format(day, 'd')}</span>
                                {count > 0 && (
                                    <div className="absolute bottom-1 w-full flex justify-center gap-0.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[hsl(var(--primary))]'}`} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Daily Summary */}
            <div className="flex flex-col gap-4">
                <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest flex justify-between items-center border-b border-[hsl(var(--border))] pb-2">
                    <span>{selectedDateStr ? format(new Date(selectedDateStr), 'dd MMM yyyy') : 'Today\'s Targets'}</span>
                    <span className="bg-muted px-2 py-0.5 rounded-full">{highlightedTickets.length}</span>
                </h4>
                
                {highlightedTickets.length === 0 ? (
                    <div className="py-6 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-[hsl(var(--border))] opacity-70">
                        <CalendarIcon className="w-6 h-6 mb-2 opacity-30" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Items Scheduled</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 custom-scrollbar overflow-y-auto max-h-[300px] pr-2">
                        {highlightedTickets.map(t => (
                            <div key={t.id} className="p-4 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl flex flex-col gap-3 hover:border-[hsl(var(--primary))]/50 hover:shadow-md transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-extrabold text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-1.5 bg-[hsl(var(--primary))]/10 px-2 py-0.5 rounded-full shrink-0">
                                        <Clock className="w-3 h-3" />
                                        {t.scheduledTimeSlot || t.scheduledTime || 'TBA'}
                                    </span>
                                    <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md border text-right max-w-[80px] shrink-0 ${
                                        t.status === 'TODO' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        t.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                        t.status === 'RESOLVED' ? 'bg-[hsl(var(--success-500))]/10 text-[hsl(var(--success-500))] border-[hsl(var(--success-500))]/20' :
                                        'bg-muted text-muted-foreground border-[hsl(var(--border))]'
                                    }`}>
                                        {t.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-[hsl(var(--foreground))] line-clamp-2 leading-relaxed" title={t.title || t.itemName || 'Untitled'}>
                                    {t.title || t.itemName || '-'}
                                </p>
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-3 border-t border-[hsl(var(--border))] mt-1">
                                    <span className="truncate pr-2">{t.assignedTo?.fullName || 'Unassigned'}</span>
                                    <span className="shrink-0 text-[10px] font-mono">#{t.ticketNumber?.slice(-6) || ''}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};