import React, { useEffect, useState } from 'react';
import { Settings, Wrench, Clock, CheckCircle2 } from 'lucide-react';

interface HardwareStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
}

interface StatsCardsProps {
    stats?: HardwareStats;
    isLoading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, colorClass, gradientClass, delay }: { title: string, value: number, icon: any, colorClass: string, gradientClass: string, delay: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (value === 0) return;
        let start = 0;
        const end = value;
        const duration = 1000;
        const incrementTime = Math.max(duration / end, 20);

        const timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start >= end) clearInterval(timer);
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <div className={`p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl relative overflow-hidden transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out animate-in fade-in slide-in-from-bottom-4 shadow-sm group hover:shadow-md hover:border-[hsl(var(--primary))]/30`} style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradientClass} opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110`} />
            
            <div className="flex items-center justify-between relative z-10 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} bg-opacity-10 shadow-inner flex items-center justify-center text-white ${colorClass}`}>
                    <Icon className="w-5 h-5 drop-shadow-sm" />
                </div>
            </div>

            <div className="relative z-10 mt-2">
                <div className="text-3xl font-extrabold tracking-tighter text-[hsl(var(--foreground))]">
                    {count}
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                    {title}
                </div>
            </div>
        </div>
    );
};

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-sm"></div>
                ))}
            </div>
        );
    }

    const data = stats || { total: 0, pending: 0, inProgress: 0, completed: 0 };

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard 
                title="Total Requests" 
                value={data.total} 
                icon={Settings} 
                colorClass="text-zinc-700 dark:text-zinc-300"
                gradientClass="from-zinc-500 to-zinc-700"
                delay={0}
            />
            <StatCard 
                title="Scheduled" 
                value={data.pending} 
                icon={Clock} 
                colorClass="text-amber-500"
                gradientClass="from-amber-400 to-amber-600"
                delay={100}
            />
            <StatCard 
                title="In Progress" 
                value={data.inProgress} 
                icon={Wrench} 
                colorClass="text-blue-500"
                gradientClass="from-blue-400 to-blue-600"
                delay={200}
            />
            <StatCard 
                title="Completed" 
                value={data.completed} 
                icon={CheckCircle2} 
                colorClass="text-emerald-500"
                gradientClass="from-emerald-400 to-emerald-600"
                delay={300}
            />
        </div>
    );
};