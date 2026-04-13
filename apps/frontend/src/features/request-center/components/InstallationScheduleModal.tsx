import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, ArrowRight, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { useMonthlyAvailability } from '../api/ict-budget.api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';

interface InstallationScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string, timeSlot: string) => void;
    itemName: string;
    isSubmitting: boolean;
}

export const InstallationScheduleModal: React.FC<InstallationScheduleModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    isSubmitting
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-based

    const { data: availability, isLoading } = useMonthlyAvailability(year, month);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    const getDayAvailability = (date: Date) => {
        if (!availability) return null;
        const dateStr = format(date, 'yyyy-MM-dd');
        return availability.find(a => {
            // Handle both YYYY-MM-DD and full ISO strings
            const entryDate = typeof a.date === 'string' ? a.date.split('T')[0] : '';
            return entryDate === dateStr;
        });
    };

    const isDateDisabled = (date: Date) => {
        const today = startOfDay(new Date());
        if (isBefore(date, today)) return true;
        const dayAvail = getDayAvailability(date);
        return dayAvail ? !dayAvail.available : false;
    };

    const handleDateSelect = (date: Date) => {
        if (isDateDisabled(date)) return;
        setSelectedDate(date);
        setSelectedSlot(null); // Reset slot when date changes
    };

    const selectedDaySlots = selectedDate ? getDayAvailability(selectedDate)?.slots : [];

    const handleConfirm = () => {
        if (selectedDate && selectedSlot) {
            onConfirm(format(selectedDate, 'yyyy-MM-dd'), selectedSlot);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-[hsl(var(--border))] flex justify-between items-center bg-muted/20">
                    <div>
                        <h2 className="text-xl font-extrabold text-[hsl(var(--foreground))] tracking-tight uppercase">Installation Schedule</h2>
                        <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-60">Select availability for {itemName}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 rounded-2xl hover:bg-muted text-muted-foreground hover:text-[hsl(var(--foreground))] transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-grow flex flex-col md:flex-row gap-10">
                    
                    {/* Calendar Section */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <button 
                                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                className="p-2.5 rounded-xl bg-muted border border-[hsl(var(--border))] hover:bg-[hsl(var(--border))] text-muted-foreground transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-90"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                            </button>
                            <h3 className="font-extrabold text-[hsl(var(--foreground))] uppercase tracking-widest text-sm">{format(currentDate, 'MMMM yyyy')}</h3>
                            <button 
                                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                className="p-2.5 rounded-xl bg-muted border border-[hsl(var(--border))] hover:bg-[hsl(var(--border))] text-muted-foreground transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-90"
                            >
                                <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-[hsl(var(--primary))] animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center text-[10px] font-extrabold text-muted-foreground py-2 uppercase tracking-tighter opacity-50">
                                        {day}
                                    </div>
                                ))}
                                
                                {/* Empty cells for start of month */}
                                {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} className="p-2" />
                                ))}

                                {/* Days */}
                                {daysInMonth.map(date => {
                                    const disabled = isDateDisabled(date);
                                    const isSelected = selectedDate && isSameDay(selectedDate, date);
                                    const dayAvail = getDayAvailability(date);
                                    const isPast = isBefore(date, startOfDay(new Date()));
                                    
                                    // Visual indicator dots
                                    const showAvailableDot = !disabled && !isPast && dayAvail?.available;
                                    const showFullDot = !isPast && dayAvail && !dayAvail.available;

                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => handleDateSelect(date)}
                                            disabled={disabled || isPast}
                                            className={`
                                                relative h-11 w-11 rounded-2xl flex flex-col items-center justify-center transition-[opacity,transform,colors] duration-200 ease-out mx-auto text-sm font-bold
                                                ${isSelected 
                                                    ? 'bg-[hsl(var(--primary))] text-white shadow-lg shadow-primary/30 scale-110 z-10' 
                                                    : disabled || isPast
                                                        ? 'opacity-20 cursor-not-allowed text-muted-foreground' 
                                                        : 'hover:bg-muted text-muted-foreground hover:text-[hsl(var(--foreground))] hover:scale-105'
                                                }
                                            `}
                                        >
                                            <span>{format(date, 'd')}</span>
                                            
                                            {/* Status Dots */}
                                            <div className="absolute bottom-1.5 flex gap-1">
                                                {showAvailableDot && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[hsl(var(--success-500))]'}`} />}
                                                {showFullDot && <span className="w-1 h-1 rounded-full bg-[hsl(var(--error-500))] opacity-50" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Time Slot Section */}
                    <div className="w-full md:w-64 flex flex-col gap-6">
                        {selectedDate ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-6">
                                    <h4 className="text-xs font-extrabold text-[hsl(var(--foreground))] mb-1 flex items-center gap-2 uppercase tracking-widest">
                                        <Clock className="w-4 h-4 text-[hsl(var(--primary))]" /> Available Time
                                    </h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{format(selectedDate, 'EEEE, dd MMMM yyyy')}</p>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedDaySlots && selectedDaySlots.length > 0 ? (
                                        selectedDaySlots.map(slot => (
                                            <button
                                                key={slot.time}
                                                onClick={() => setSelectedSlot(slot.time)}
                                                disabled={!slot.available}
                                                className={`
                                                    w-full p-4 rounded-2xl border-2 text-left transition-[opacity,transform,colors] duration-200 ease-out relative overflow-hidden group
                                                    ${!slot.available 
                                                        ? 'bg-muted/30 border-transparent opacity-40 cursor-not-allowed'
                                                        : selectedSlot === slot.time
                                                            ? 'bg-[hsl(var(--primary))]/5 border-[hsl(var(--primary))] text-[hsl(var(--primary))] shadow-sm'
                                                            : 'bg-muted/50 border-transparent hover:border-[hsl(var(--border))] text-muted-foreground'
                                                    }
                                                `}
                                            >
                                                <div className="font-extrabold text-sm mb-0.5 tracking-tight">{slot.time}</div>
                                                <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">
                                                    {slot.capacity - slot.booked} Slots Left
                                                </div>
                                                {selectedSlot === slot.time && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-6 bg-muted/50 rounded-2xl text-[10px] font-bold text-muted-foreground text-center border border-dashed border-[hsl(var(--border))] uppercase tracking-widest leading-relaxed">
                                            No slots available for this date.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-[2rem] border-2 border-dashed border-[hsl(var(--border))] text-muted-foreground group">
                                <CalendarIcon className="w-10 h-10 mb-4 opacity-20 group-hover:scale-110 transition-transform duration-500" />
                                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">Pick a date from the calendar to view available slots.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-[hsl(var(--border))] bg-muted/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                        <Info className="w-4 h-4 text-[hsl(var(--primary))]" /> Max 2 installs per shift.
                    </div>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedDate || !selectedSlot || isSubmitting}
                        className="px-8 py-3.5 bg-[hsl(var(--primary))] text-white font-extrabold rounded-2xl hover:brightness-110 disabled:opacity-50 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out flex items-center gap-3 shadow-lg shadow-primary/20 text-xs uppercase tracking-widest active:scale-95 group"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        Confirm Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};

// Mini icons missing from lucide
function ArrowLeftIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
  )
}
function ArrowRightIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  )
}