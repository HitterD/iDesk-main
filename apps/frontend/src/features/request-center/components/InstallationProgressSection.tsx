import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wrench, CheckCircle2, Clock, Calendar } from 'lucide-react';
import {
  useIctBudgetRequestInstallations,
  type InstallationTicket,
} from '../api/ict-budget.api';

function getStatusStyle(status: string) {
  switch (status) {
    case 'RESOLVED':
      return { 
        border: 'border-l-[hsl(var(--success-500))]', 
        badge: 'bg-[hsl(var(--success-500))]/10 text-[hsl(var(--success-500))] dark:bg-[hsl(var(--success-500))]/20', 
        label: 'Completed', 
        icon: <CheckCircle2 className="w-3 h-3" /> 
      };
    case 'IN_PROGRESS':
      return { 
        border: 'border-l-[hsl(var(--info-500))]', 
        badge: 'bg-[hsl(var(--info-500))]/10 text-[hsl(var(--info-500))] dark:bg-[hsl(var(--info-500))]/20', 
        label: 'In Progress', 
        icon: <Wrench className="w-3 h-3" /> 
      };
    default:
      return { 
        border: 'border-l-[hsl(var(--warning-500))]', 
        badge: 'bg-[hsl(var(--warning-500))]/10 text-[hsl(var(--warning-500))] dark:bg-[hsl(var(--warning-500))]/20', 
        label: 'Scheduled', 
        icon: <Calendar className="w-3 h-3" /> 
      };
  }
}

interface Props {
  ictBudgetId: string;
}

export function InstallationProgressSection({ ictBudgetId }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const { data: response, isLoading } = useIctBudgetRequestInstallations(ictBudgetId);

  useEffect(() => {
    if (searchParams.get('highlight') === 'installation' && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams, response]);

  if (isLoading) {
    return (
      <div className="bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/15 rounded-2xl p-6 animate-pulse space-y-4">
        <div className="flex items-center justify-between">
           <div className="h-6 bg-[hsl(var(--primary))]/10 rounded-lg w-48" />
           <div className="h-6 bg-[hsl(var(--primary))]/10 rounded-full w-24" />
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))]" />
          <div className="h-20 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))]" />
        </div>
      </div>
    );
  }

  if (!response || response.total === 0) {
    return null;
  }

  const { data: installations, total, installed } = response;

  return (
    <div
      ref={sectionRef}
      className="bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/15 dark:bg-[hsl(var(--primary))]/10 dark:border-[hsl(var(--primary))]/20 rounded-2xl p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center text-[hsl(var(--primary))] shadow-inner">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[hsl(var(--foreground))] uppercase tracking-tight">
              Installation Progress
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              Tracking real-time hardware deployment
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-[hsl(var(--primary))] text-primary-foreground text-[10px] font-extrabold uppercase tracking-widest shadow-md shadow-primary/20">
          {installed}/{total} Completed
        </div>
      </div>

      {/* Installation Items */}
      <div className="space-y-3">
        {installations.map((item) => {
          const style = getStatusStyle(item.status);
          return (
            <div
              key={item.id}
              className={`bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] border-l-[4px] ${style.border} shadow-sm group hover:shadow-md transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out `}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-[hsl(var(--foreground))] flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground opacity-50 font-extrabold uppercase">#{ (item.itemIndex ?? 0) + 1 }</span>
                    {item.itemName || 'Unknown Hardware'}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="text-[hsl(var(--primary))] font-extrabold tracking-tighter">{item.ticketNumber || 'N/A'}</span>
                    <span className="opacity-40">|</span>
                    <span>
                        {item.assignedTo
                            ? `Assigned: ${item.assignedTo.fullName}`
                            : 'Unassigned'}
                    </span>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${style.badge}`}>
                  {style.icon}
                  {style.label}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]/50 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                <Calendar className="w-3 h-3" />
                {item.scheduledDate
                  ? `Scheduled: ${new Date(item.scheduledDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}${item.scheduledTimeSlot ? `, ${item.scheduledTimeSlot}` : ''}`
                  : 'No schedule assigned yet'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}