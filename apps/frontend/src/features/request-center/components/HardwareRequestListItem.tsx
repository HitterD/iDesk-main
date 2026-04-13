import React from 'react';
import { format } from 'date-fns';
import { Package, User as UserIcon, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { IctBudgetRequest } from '../api/ict-budget.api';
import { getStatusAccentColor, getStatusBadgeStyles, getRequestDisplayData, formatStatus } from '../utils/hardware-request.utils';

interface Props {
    req: IctBudgetRequest;
    isExpanded: boolean;
    onToggleExpand: (id: string, e: React.MouseEvent) => void;
    onClick: (id: string) => void;
}

export const HardwareRequestListItem: React.FC<Props> = ({ req, isExpanded, onToggleExpand, onClick }) => {
    const { requesterName, currentStatus, itemCount, arrivedCount, progress, itemsString } = getRequestDisplayData(req);

    return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl overflow-hidden shadow-sm hover:border-[hsl(var(--primary))]/30 hover:shadow-md transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out relative">
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out ${getStatusAccentColor(currentStatus)}`} />
            
            <div 
                onClick={() => onClick(req.id)}
                className="grid grid-cols-12 gap-4 px-6 py-5 items-center cursor-pointer hover:bg-[hsl(var(--muted))]/10 transition-colors"
            >
                <div className="col-span-1 text-xs font-mono text-muted-foreground">
                    #{req.id.slice(0, 8)}
                </div>
                <div className="col-span-4 min-w-0">
                    <div className="font-bold text-sm text-[hsl(var(--foreground))] truncate tracking-tight">
                        {req.title || req.budgetCategory}
                    </div>
                    <div className="text-xs text-muted-foreground truncate tracking-wide opacity-70">
                        {itemsString}
                    </div>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-[hsl(var(--primary))]">
                        {requesterName.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-[hsl(var(--foreground))] truncate tracking-tight">
                        {requesterName}
                    </span>
                </div>
                <div className="col-span-2 flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${getStatusBadgeStyles(currentStatus)}`}>
                        {formatStatus(currentStatus)}
                    </span>
                </div>
                <div className="col-span-2 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{arrivedCount}/{itemCount}</span>
                        <span className={progress === 100 ? 'text-[hsl(var(--success-500))]' : 'text-[hsl(var(--primary))]'}>
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                        <div 
                            className={`h-full transition-[opacity,transform,colors] duration-200 ease-out ${progress === 100 ? 'bg-[hsl(var(--success-500))]' : 'bg-[hsl(var(--primary))]'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {/* Installation Indicator */}
                    {req.installationSummary && req.installationSummary.total > 0 && (
                      <div className="mt-1">
                        {req.installationSummary.installed === req.installationSummary.total ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[hsl(var(--success-500))]/10 text-[hsl(var(--success-500))] dark:bg-[hsl(var(--success-500))]/20">
                            {req.installationSummary.installed}/{req.installationSummary.total} installed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] dark:bg-[hsl(var(--primary))]/20">
                            {req.installationSummary.installed}/{req.installationSummary.total} installed
                          </span>
                        )}
                      </div>
                    )}
                </div>
                <div className="col-span-1 text-right flex items-center justify-end gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                        {format(new Date(req.createdAt), 'dd/MM/yy')}
                    </span>
                    <button 
                        onClick={(e) => onToggleExpand(req.id, e)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors duration-150"
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="px-6 py-4 bg-[hsl(var(--muted))]/5 border-t border-[hsl(var(--border))] animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[hsl(var(--primary))] mb-4 flex items-center gap-2">
                                <Package className="w-3 h-3" /> Requested Items
                            </h4>
                            <div className="space-y-2">
                                {req.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${item.isArrived ? 'bg-[hsl(var(--success-500))]' : 'bg-amber-500'}`} />
                                            <span className="text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-tight">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {req.vendor && (
                                                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-[hsl(var(--muted))] rounded-lg">
                                                    {req.vendor}
                                                </span>
                                            )}
                                            <span className={`text-[9px] font-extrabold uppercase tracking-widest ${item.isArrived ? 'text-[hsl(var(--success-500))]' : 'text-amber-500'}`}>
                                                {item.isArrived ? 'ARRIVED' : 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[hsl(var(--primary))] mb-4 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Order Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                                    <p className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Category</p>
                                    <p className="text-[10px] font-extrabold text-[hsl(var(--foreground))] uppercase tracking-tight">{req.budgetCategory || 'GENERAL'}</p>
                                </div>
                                <div className="p-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                                    <p className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Requester</p>
                                    <p className="text-[10px] font-extrabold text-[hsl(var(--foreground))] uppercase tracking-tight flex items-center gap-1.5">
                                        <UserIcon className="w-3 h-3" /> {requesterName}
                                    </p>
                                </div>
                                <div className="p-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                                    <p className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Created At</p>
                                    <p className="text-[10px] font-extrabold text-[hsl(var(--foreground))] uppercase tracking-tight">{format(new Date(req.createdAt), 'PPPP')}</p>
                                </div>
                                <div className="p-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm">
                                    <p className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Status</p>
                                    <p className="text-[10px] font-extrabold text-[hsl(var(--foreground))] uppercase tracking-tight">{formatStatus(currentStatus)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
