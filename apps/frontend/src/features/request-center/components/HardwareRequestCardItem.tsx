import React from 'react';
import { format } from 'date-fns';
import { Package } from 'lucide-react';
import { IctBudgetRequest } from '../api/ict-budget.api';
import { getStatusAccentColor, getStatusBadgeStyles, getRequestDisplayData, formatStatus } from '../utils/hardware-request.utils';

interface Props {
    req: IctBudgetRequest;
    onClick: (id: string) => void;
}

export const HardwareRequestCardItem: React.FC<Props> = ({ req, onClick }) => {
    const { requesterName, currentStatus, itemCount, arrivedCount, progress } = getRequestDisplayData(req);

    return (
        <div 
            onClick={() => onClick(req.id)}
            className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 cursor-pointer group hover:shadow-xl hover:shadow-primary/5 hover:border-[hsl(var(--primary))]/30 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out flex flex-col relative overflow-hidden active:scale-[0.98] shadow-sm"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out group-hover:w-2 ${getStatusAccentColor(currentStatus)}`} />

            <div className="flex justify-between items-start mb-4 pl-1">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground opacity-60">Order #{req.id.slice(0, 8)}</span>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors leading-tight tracking-tight uppercase">
                        {req.title || `${req.budgetCategory}`}
                    </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${getStatusBadgeStyles(currentStatus)}`}>
                    {formatStatus(currentStatus)}
                </span>
            </div>

            <div className="flex items-center gap-3 mb-6 pl-1">
                <div className="w-10 h-10 rounded-xl bg-muted border border-[hsl(var(--border))] flex items-center justify-center text-sm font-bold text-[hsl(var(--primary))] shadow-sm">
                    {requesterName.charAt(0)}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-[hsl(var(--foreground))] tracking-tight">{requesterName}</span>
                    <span className="text-[10px] font-medium text-muted-foreground opacity-60">{format(new Date(req.createdAt), 'dd MMM yyyy')}</span>
                </div>
            </div>

            <div className="mt-auto pl-1 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[hsl(var(--primary))]" />
                        Progress
                    </span>
                    <span className={progress === 100 ? 'text-[hsl(var(--success-500))]' : 'text-[hsl(var(--primary))]'}>
                        {arrivedCount}/{itemCount} Items
                    </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                    <div 
                        className={`h-full transition-[opacity,transform,colors] duration-200 ease-out rounded-full ${
                            progress === 100 ? 'bg-[hsl(var(--success-500))]' : 'bg-[hsl(var(--primary))]'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Installation Indicator */}
                {req.installationSummary && req.installationSummary.total > 0 ? (
                  <div className="mt-2 flex items-center gap-2">
                    {req.installationSummary.installed === req.installationSummary.total ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[hsl(var(--success-500))]/10 text-[hsl(var(--success-500))] dark:bg-[hsl(var(--success-500))]/20">
                        {req.installationSummary.installed}/{req.installationSummary.total} installed
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] dark:bg-[hsl(var(--primary))]/20">
                          {req.installationSummary.installed}/{req.installationSummary.total} installed
                        </span>
                        {req.installationSummary.nextScheduledDate && (
                          <span className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest">
                            Next: {new Date(req.installationSummary.nextScheduledDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ) : (req.realizationStatus === 'ARRIVED' || req.realizationStatus === 'REALIZED') ? (
                  <div className="mt-2">
                    <span className="text-[10px] text-muted-foreground italic opacity-50 font-medium uppercase tracking-widest">Belum ada instalasi</span>
                  </div>
                ) : null}
            </div>
        </div>
    );
};
