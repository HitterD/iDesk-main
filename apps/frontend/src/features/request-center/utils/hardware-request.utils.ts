import { format, isValid } from 'date-fns';
import { IctBudgetRequest, IctBudgetRealizationStatus } from '../api/ict-budget.api';

export const safeFormatDate = (dateStr: string | null | undefined, formatStr: string = 'dd MMM yyyy'): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (!isValid(date)) return 'Invalid Date';
    return format(date, formatStr);
};

export const formatStatus = (status: string | undefined | null) =>
    status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Unknown';

export const getStatusAccentColor = (status: IctBudgetRealizationStatus): string => {
    switch (status) {
        case IctBudgetRealizationStatus.PENDING:
        case IctBudgetRealizationStatus.PURCHASING:
            return 'bg-amber-500';
        case IctBudgetRealizationStatus.REJECTED:
        case IctBudgetRealizationStatus.CANCELLED:
            return 'bg-[hsl(var(--error-500))]';
        case IctBudgetRealizationStatus.APPROVED:
        case IctBudgetRealizationStatus.PARTIALLY_ARRIVED:
        case IctBudgetRealizationStatus.ARRIVED:
        case IctBudgetRealizationStatus.REALIZED:
            return 'bg-[hsl(var(--success-500))]';
        default:
            return 'bg-[hsl(var(--primary))]';
    }
};

export const getStatusBadgeStyles = (status: IctBudgetRealizationStatus) => {
    switch (status) {
        case IctBudgetRealizationStatus.PENDING:
            return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20';
        case IctBudgetRealizationStatus.APPROVED:
        case IctBudgetRealizationStatus.REALIZED:
            return 'bg-green-100 text-green-700 border-green-200 dark:bg-[hsl(var(--success-500))]/10 dark:text-[hsl(var(--success-500))] dark:border-[hsl(var(--success-500))]/20';
        case IctBudgetRealizationStatus.PURCHASING:
            return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-[hsl(var(--primary))]/10 dark:text-[hsl(var(--primary))] dark:border-[hsl(var(--primary))]/20';
        case IctBudgetRealizationStatus.ARRIVED:
            return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20';
        case IctBudgetRealizationStatus.PARTIALLY_ARRIVED:
            return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-500 dark:border-teal-500/20';
        case IctBudgetRealizationStatus.REJECTED:
        case IctBudgetRealizationStatus.CANCELLED:
            return 'bg-red-100 text-red-700 border-red-200 dark:bg-[hsl(var(--error-500))]/10 dark:text-[hsl(var(--error-500))] dark:border-[hsl(var(--error-500))]/20';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    }
};

export const getRequestDisplayData = (req: IctBudgetRequest) => {
    const requesterName = req.requester?.fullName || req.ticket?.user?.fullName || 'Unknown';
    const currentStatus = req.realizationStatus;
    const itemCount = req.items?.length || 0;
    const arrivedCount = req.items?.filter(i => i.isArrived).length || 0;
    
    let progress = 0;
    switch (currentStatus) {
        case IctBudgetRealizationStatus.PENDING: progress = 20; break;
        case IctBudgetRealizationStatus.APPROVED: progress = 40; break;
        case IctBudgetRealizationStatus.PURCHASING: progress = 60; break;
        case IctBudgetRealizationStatus.PARTIALLY_ARRIVED: progress = 75; break;
        case IctBudgetRealizationStatus.ARRIVED: progress = 90; break;
        case IctBudgetRealizationStatus.REALIZED: progress = 100; break;
        case IctBudgetRealizationStatus.REJECTED:
        case IctBudgetRealizationStatus.CANCELLED: progress = 100; break;
        default: progress = 0; break;
    }

    const itemsString = req.items?.slice(0, 2).map((i: any) => i.name).join(', ') + 
        (itemCount > 2 ? ` and ${itemCount - 2} more` : '');

    return { requesterName, currentStatus, itemCount, arrivedCount, progress, itemsString };
};
