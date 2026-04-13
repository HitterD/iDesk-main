import React, { useState } from 'react';
import { useSchedulesByBudget, useCreateSchedule, ScheduleStatus } from '../api/schedule.api';
import { Calendar, Clock, CheckCircle, Plus, Loader2 } from 'lucide-react';

interface InstallationSchedulerProps {
    budgetId: string;
    itemName: string;
    quantity: number;
}

export const InstallationScheduler: React.FC<InstallationSchedulerProps> = ({ budgetId, itemName, quantity }) => {
    const { data: schedules = [], isLoading } = useSchedulesByBudget(budgetId);
    const createSchedule = useCreateSchedule();

    const [selectedDates, setSelectedDates] = useState<Record<number, string>>({});
    const [selectedSlots, setSelectedSlots] = useState<Record<number, string>>({});

    const handleSchedule = (index: number) => {
        const date = selectedDates[index];
        const slot = selectedSlots[index];

        if (!date || !slot) return;

        createSchedule.mutate({
            ictBudgetRequestId: budgetId,
            itemName,
            itemIndex: index,
            scheduledDate: date,
            scheduledTimeSlot: slot,
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    const items = Array.from({ length: quantity }, (_, i) => i);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[hsl(var(--primary))]/10 rounded-2xl border border-[hsl(var(--primary))]/20">
                    <Calendar className="w-6 h-6 text-[hsl(var(--primary))]" />
                </div>
                <div>
                    <h3 className="text-xl font-extrabold text-[hsl(var(--foreground))] uppercase tracking-tight">Installation Scheduler</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Plan setup for each unit of {itemName}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {items.map(index => {
                    const existingSchedule = schedules.find(s => s.itemIndex === index);
                    
                    return (
                        <div key={index} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-[2rem] relative overflow-hidden group shadow-sm hover:shadow-md transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out hover:border-[hsl(var(--primary))]/30">
                            {/* Decorative Background Element */}
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[hsl(var(--primary))]/5 rounded-full blur-2xl group-hover:bg-[hsl(var(--primary))]/10 transition-colors duration-150 " />
                            
                            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted border border-[hsl(var(--border))] text-[hsl(var(--primary))] font-extrabold text-sm shadow-inner group-hover:scale-110 transition-transform">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-extrabold text-[hsl(var(--foreground))] uppercase tracking-tight">{itemName}</h4>
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Unit #{index + 1}</span>
                                        </div>
                                    </div>
                                    
                                    {existingSchedule && (
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border shadow-sm ${
                                            existingSchedule.status === ScheduleStatus.COMPLETED ? 'bg-[hsl(var(--success-500))]/10 text-[hsl(var(--success-500))] border-[hsl(var(--success-500))]/20' :
                                            existingSchedule.status === ScheduleStatus.APPROVED ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/20' :
                                            'bg-[hsl(var(--warning-500))]/10 text-[hsl(var(--warning-500))] border-[hsl(var(--warning-500))]/20'
                                        }`}>
                                            {existingSchedule.status}
                                        </span>
                                    )}
                                </div>

                                {existingSchedule ? (
                                    <div className="bg-muted/30 rounded-2xl p-5 border border-[hsl(var(--border))] mt-2 group-hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3 text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-tight">
                                                <Calendar className="w-4 h-4 text-[hsl(var(--primary))]" />
                                                {new Date(existingSchedule.scheduledDate).toLocaleDateString('id-ID', {
                                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-tight">
                                                <Clock className="w-4 h-4 text-[hsl(var(--primary))]" />
                                                {existingSchedule.scheduledTimeSlot}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5 mt-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest ml-1">Date</label>
                                                <input 
                                                    type="date"
                                                    value={selectedDates[index] || ''}
                                                    onChange={e => setSelectedDates(p => ({ ...p, [index]: e.target.value }))}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-2xl px-4 py-3 text-xs font-bold text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-colors duration-150"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest ml-1 text-center block">Time Slot</label>
                                                <div className="flex gap-2">
                                                    {['08:00-12:00', '13:00-17:00'].map(slot => (
                                                        <button
                                                            key={slot}
                                                            onClick={() => setSelectedSlots(p => ({ ...p, [index]: slot }))}
                                                            className={`flex-1 py-3 rounded-2xl text-[9px] font-extrabold transition-colors duration-150 border-2 uppercase tracking-tighter ${
                                                                selectedSlots[index] === slot
                                                                    ? 'bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))] text-[hsl(var(--primary))] shadow-sm'
                                                                    : 'bg-muted/50 border-transparent text-muted-foreground hover:border-[hsl(var(--border))]'
                                                            }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => handleSchedule(index)}
                                            disabled={!selectedDates[index] || !selectedSlots[index] || createSchedule.isPending}
                                            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-[0.98] ${
                                                selectedDates[index] && selectedSlots[index] && !createSchedule.isPending
                                                    ? 'bg-[hsl(var(--primary))] text-white hover:brightness-110 shadow-lg shadow-primary/20'
                                                    : 'bg-muted text-muted-foreground cursor-not-allowed border border-[hsl(var(--border))]'
                                            }`}
                                        >
                                            {createSchedule.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            {createSchedule.isPending ? 'Scheduling...' : 'Schedule Now'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
