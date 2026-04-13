import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Tag, PackageCheck, AlertCircle, CheckCircle2, Circle, Truck, Wrench, Clock, Package, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { StatusPipeline } from '../components/StatusPipeline';
import { ApprovalPanel } from '../components/ApprovalPanel';
import { PurchasingPanel } from '../components/PurchasingPanel';
import { InstallationScheduleModal } from '../components/InstallationScheduleModal';
import { InstallationProgressSection } from '../components/InstallationProgressSection';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { 
    useIctBudgetDetail, 
    useApproveIctBudget, 
    useStartPurchasing, 
    useMarkArrived,
    useRealizeIctBudget,
    useRequestItemInstallation,
    useIctBudgetSchedules,
    useApproveInstallation,
    useRescheduleInstallation,
    useCompleteInstallation,
    useCancelIctBudget,
    IctBudgetRealizationStatus 
} from '../api/ict-budget.api';
import { useIctBudgetActivities } from '../api/hardware-request.api';
import { useAuth } from '@/stores/useAuth';
import { format } from 'date-fns';
export const HardwareRequestDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: request, isLoading } = useIctBudgetDetail(id || '');
    const { data: activities = [] } = useIctBudgetActivities(id || '');
    const { data: schedules = [] } = useIctBudgetSchedules(id || '');

    const approveMutation = useApproveIctBudget();
    const startPurchasingMutation = useStartPurchasing();
    const markArrivedMutation = useMarkArrived();
    const realizeMutation = useRealizeIctBudget();
    const requestInstallationMutation = useRequestItemInstallation();
    const approveInstallMutation = useApproveInstallation();
    const rescheduleInstallMutation = useRescheduleInstallation();
    const completeInstallMutation = useCompleteInstallation();
    const cancelMutation = useCancelIctBudget();

    const [selectedArrivalItems, setSelectedArrivalItems] = useState<string[]>([]);
    const [installModalData, setInstallModalData] = useState<{ isOpen: boolean, itemId: string, itemName: string, isRescheduling?: boolean, scheduleId?: string }>({
        isOpen: false,
        itemId: '',
        itemName: ''
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-20">
                <Loader2 className="h-10 w-10 text-[hsl(var(--primary))] animate-spin" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground p-20">
                <AlertCircle className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-extrabold text-[hsl(var(--foreground))] uppercase tracking-tight">Request Not Found</h2>
                <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-muted hover:bg-[hsl(var(--border))] text-muted-foreground font-bold rounded-xl transition-colors duration-150 uppercase tracking-widest text-xs">Go Back</button>
            </div>
        );
    }

    const currentStatus = request.realizationStatus;
    const hasAgentRole = ['ADMIN', 'AGENT', 'AGENT_OPERATIONAL_SUPPORT', 'AGENT_ADMIN', 'AGENT_ORACLE'].includes(user?.role || '');
    const isOwner = user?.id === request.requesterId || user?.id === (request as any).ticket?.userId;

    const canApprove = (user?.role === 'ADMIN' || user?.role === 'MANAGER' || hasAgentRole) && 
                      currentStatus === IctBudgetRealizationStatus.PENDING;

    const canProcessPurchasing = hasAgentRole && 
                                (currentStatus === IctBudgetRealizationStatus.APPROVED || 
                                 currentStatus === IctBudgetRealizationStatus.PURCHASING || 
                                 currentStatus === IctBudgetRealizationStatus.PARTIALLY_ARRIVED ||
                                 currentStatus === IctBudgetRealizationStatus.ARRIVED);

    const isPurchasingOrPartial = currentStatus === IctBudgetRealizationStatus.PURCHASING || currentStatus === IctBudgetRealizationStatus.PARTIALLY_ARRIVED;

    const handleToggleArrival = (itemId: string) => {
        setSelectedArrivalItems(prev => 
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSaveArrivals = async () => {
        if (selectedArrivalItems.length === 0) {
            toast.error('Select at least one item that has arrived.');
            return;
        }
        try {
            await markArrivedMutation.mutateAsync({ id: request.id, itemIds: selectedArrivalItems });
            toast.success('Item arrival status updated successfully');
            setSelectedArrivalItems([]); // reset selection
        } catch (error) {
            toast.error('Failed to update item status');
        }
    };

    const handleRequestInstallation = (itemId: string, itemName: string) => {
        setInstallModalData({ isOpen: true, itemId, itemName });
    };

    const handleReschedule = (itemId: string, itemName: string, scheduleId: string) => {
        setInstallModalData({ isOpen: true, itemId, itemName, isRescheduling: true, scheduleId });
    };

    const handleConfirmInstallation = async (date: string, timeSlot: string) => {
        try {
            if (installModalData.isRescheduling && installModalData.scheduleId) {
                await rescheduleInstallMutation.mutateAsync({
                    budgetId: request.id,
                    scheduleId: installModalData.scheduleId,
                    date,
                    timeSlot,
                    reason: 'Rescheduled by Agent'
                });
                toast.success('Schedule has been rearranged');
            } else {
                await requestInstallationMutation.mutateAsync({ 
                    id: request.id, 
                    itemId: installModalData.itemId,
                    date,
                    timeSlot
                });
                toast.success('Installation request sent successfully');
            }
            setInstallModalData({ isOpen: false, itemId: '', itemName: '' });
        } catch (error) {
            toast.error('Failed to process installation schedule');
        }
    };

    const handleApproveInstall = async (scheduleId: string) => {
        try {
            await approveInstallMutation.mutateAsync({ budgetId: request.id, scheduleId });
            toast.success('Installation schedule confirmed');
        } catch (error) {
            toast.error('Failed to confirm schedule');
        }
    };

    const handleCompleteInstall = async (scheduleId: string) => {
        try {
            await completeInstallMutation.mutateAsync({ budgetId: request.id, scheduleId });
            toast.success('Installation marked as completed');
        } catch (error) {
            toast.error('Failed to complete installation');
        }
    };

    const requesterName = request.requester?.fullName || (request as any).ticket?.user?.fullName || 'Unknown User';

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <InstallationScheduleModal 
                isOpen={installModalData.isOpen}
                onClose={() => setInstallModalData({ isOpen: false, itemId: '', itemName: '' })}
                onConfirm={handleConfirmInstallation}
                itemName={installModalData.itemName}
                isSubmitting={requestInstallationMutation.isPending}
            />
            
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                <div className="flex gap-6 items-start">
                    <button 
                        onClick={() => navigate(-1)}
                        className="mt-1 w-12 h-12 rounded-2xl flex items-center justify-center bg-muted border border-[hsl(var(--border))] text-muted-foreground hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-90 shrink-0 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3.5 py-1.5 rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-mono text-[10px] font-extrabold tracking-widest border border-[hsl(var(--primary))]/20 uppercase shadow-sm">
                                Order #{request.id.slice(0, 8)}
                            </span>
                            <span className="px-3.5 py-1.5 rounded-xl bg-muted text-muted-foreground font-extrabold text-[10px] tracking-widest border border-[hsl(var(--border))] uppercase">
                                {request.requestType}
                            </span>
                            <span className={`px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${
                                currentStatus === IctBudgetRealizationStatus.PENDING ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                currentStatus === IctBudgetRealizationStatus.REJECTED ? 'bg-[hsl(var(--error-500))]/10 text-[hsl(var(--error-500))] border-[hsl(var(--error-500))]/20' :
                                currentStatus === IctBudgetRealizationStatus.REALIZED ? 'bg-[hsl(var(--success-500))]/10 text-[hsl(var(--success-500))] border-[hsl(var(--success-500))]/20' :
                                'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/20'
                            }`}>
                                {(currentStatus || 'UNKNOWN').replace(/_/g, ' ')}
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-[hsl(var(--foreground))] tracking-tighter leading-tight uppercase">
                            Hardware Procurement Detail
                        </h1>
                        <p className="text-muted-foreground text-sm font-bold flex items-center gap-3 opacity-60 uppercase tracking-widest">
                            <User className="w-4 h-4 text-[hsl(var(--primary))]" /> {requesterName} <span className="opacity-30">|</span> {format(new Date(request.createdAt), 'dd MMMM yyyy')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pipeline Tracker Card */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--primary))]/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                <StatusPipeline currentStatus={currentStatus || IctBudgetRealizationStatus.PENDING} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Column: Shipment Items & Tracking */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    
                    {/* Shipment Items List (Replacement for Checklist) */}
                    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2.5rem] p-10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-extrabold text-[hsl(var(--foreground))] flex items-center gap-3 uppercase tracking-tight">
                                <PackageCheck className="w-6 h-6 text-[hsl(var(--primary))]" /> Shipment Items
                            </h3>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest opacity-60">
                                    {request.items?.filter(i => i.isArrived).length || 0} OF {request.items?.length || 0} ITEMS DELIVERED
                                </span>
                                <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[hsl(var(--primary))] transition-[opacity,transform,colors] duration-200 ease-out "
                                        style={{ width: `${((request.items?.filter(i => i.isArrived).length || 0) / (request.items?.length || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {request.items && request.items.map((item, idx) => {
                                const isChecked = selectedArrivalItems.includes(item.id);
                                const isAlreadyArrived = item.isArrived;
                                const showCheckbox = hasAgentRole && isPurchasingOrPartial && !isAlreadyArrived;
                                const canUserRequestInstall = isOwner && isAlreadyArrived && !item.hasInstallationTicket && (request as any).budgetCategory === 'HARDWARE';
                                const schedule = schedules.find(s => s.itemIndex === idx);

                                return (
                                    <div 
                                        key={item.id} 
                                        className={`p-6 rounded-3xl border transition-[opacity,transform,colors] duration-200 ease-out flex flex-col relative overflow-hidden group ${
                                            isAlreadyArrived 
                                                ? 'bg-[hsl(var(--success-500))]/5 border-[hsl(var(--success-500))]/20' 
                                                : isChecked
                                                    ? 'bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/30'
                                                    : 'bg-muted/30 border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/30'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-150 ${
                                                    isAlreadyArrived ? 'bg-[hsl(var(--success-500))]/20 text-[hsl(var(--success-500))]' : 'bg-muted border border-[hsl(var(--border))] text-muted-foreground group-hover:text-[hsl(var(--primary))] group-hover:border-[hsl(var(--primary))]/20'
                                                }`}>
                                                    <Package className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-extrabold uppercase tracking-tight ${isAlreadyArrived ? 'text-[hsl(var(--success-500))]' : 'text-[hsl(var(--foreground))]'}`}>
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest">UNIT #{idx + 1}</p>
                                                </div>
                                            </div>

                                            {showCheckbox && (
                                                <button 
                                                    onClick={() => handleToggleArrival(item.id)}
                                                    className="shrink-0 focus:outline-none"
                                                >
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-[opacity,transform,colors] duration-200 ease-out ${
                                                        isChecked ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'bg-transparent border-muted-foreground/30'
                                                    }`}>
                                                        {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                    </div>
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-[hsl(var(--border))] flex flex-col gap-3">
                                            {isAlreadyArrived ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-[hsl(var(--success-500))] uppercase tracking-widest">
                                                        <CheckCircle2 className="w-4 h-4" /> Delivered
                                                    </div>
                                                    {item.arrivedAt && (
                                                        <span className="text-[9px] font-bold text-muted-foreground opacity-60 uppercase tracking-tighter">
                                                            {format(new Date(item.arrivedAt), 'dd MMM yyyy, HH:mm')}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[10px] font-extrabold text-muted-foreground/40 uppercase tracking-widest">
                                                    <Truck className="w-4 h-4 animate-pulse" /> In Transit
                                                </div>
                                            )}

                                            {/* Installation Status/Actions */}
                                            {canUserRequestInstall && (
                                                <button 
                                                    onClick={() => handleRequestInstallation(item.id, item.name)}
                                                    disabled={requestInstallationMutation.isPending}
                                                    className="w-full py-3 bg-[hsl(var(--primary))] text-white hover:brightness-110 rounded-2xl text-[10px] font-extrabold transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95"
                                                >
                                                    <Wrench className="w-3.5 h-3.5" /> Book Installation
                                                </button>
                                            )}
                                            
                                            {item.hasInstallationTicket && (
                                                <div className="flex flex-col gap-3 bg-muted/50 p-3 rounded-2xl border border-[hsl(var(--border))]">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-lg ${
                                                            schedule?.status === 'COMPLETED' ? 'text-[hsl(var(--success-500))] bg-[hsl(var(--success-500))]/10' :
                                                            schedule?.status === 'APPROVED' ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10' :
                                                            'text-amber-500 bg-amber-500/10'
                                                        }`}>
                                                            {schedule?.status === 'PENDING' ? 'Awaiting Confirm' : 
                                                             schedule?.status === 'APPROVED' ? 'Schedule Fixed' :
                                                             schedule?.status === 'RESCHEDULED' ? 'Rescheduled' : 'Installed'}
                                                        </span>
                                                        {schedule && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] font-extrabold text-[hsl(var(--foreground))]">{format(new Date(schedule.scheduledDate), 'dd MMM')}</span>
                                                                <span className="text-[8px] font-bold text-muted-foreground opacity-60 uppercase">{schedule.scheduledTimeSlot}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Admin Actions for Schedule */}
                                                    {hasAgentRole && (schedule?.status === 'PENDING' || schedule?.status === 'RESCHEDULED') && (
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => handleApproveInstall(schedule.id)}
                                                                disabled={approveInstallMutation.isPending}
                                                                className="flex-1 py-1.5 bg-[hsl(var(--success-500))] text-white rounded-xl text-[9px] font-extrabold hover:brightness-110 transition-[opacity,transform,colors] duration-200 ease-out uppercase tracking-widest"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReschedule(item.id, item.name, schedule.id)}
                                                                className="flex-1 py-1.5 bg-muted border border-[hsl(var(--border))] text-muted-foreground rounded-xl text-[9px] font-extrabold hover:bg-[hsl(var(--border))] transition-colors duration-150 uppercase tracking-widest"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    )}

                                                    {hasAgentRole && schedule?.status === 'APPROVED' && (
                                                        <button 
                                                            onClick={() => handleCompleteInstall(schedule.id)}
                                                            disabled={completeInstallMutation.isPending}
                                                            className="w-full py-1.5 bg-[hsl(var(--primary))] text-white rounded-xl text-[9px] font-extrabold hover:brightness-110 transition-[opacity,transform,colors] duration-200 ease-out uppercase tracking-widest"
                                                        >
                                                            Mark Installed
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Save Arrival Action Floating Bar */}
                        {selectedArrivalItems.length > 0 && (
                            <div className="mt-10 pt-8 border-t border-[hsl(var(--border))] flex justify-end animate-in fade-in slide-in-from-bottom-4">
                                <button
                                    onClick={handleSaveArrivals}
                                    disabled={markArrivedMutation.isPending}
                                    className="px-10 py-5 bg-[hsl(var(--primary))] text-white font-extrabold rounded-[2rem] text-xs uppercase tracking-widest transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 flex items-center gap-4"
                                >
                                    {markArrivedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    Update Delivered Items ({selectedArrivalItems.length})
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Installation Progress Section */}
                    <InstallationProgressSection ictBudgetId={id!} />

                    {/* Tracking History Log */}
                    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2.5rem] p-10 shadow-sm">
                        <ActivityTimeline activities={activities} />
                    </div>
                </div>

                {/* Right Column: Order Summary & Actions (Sticky) */}
                <div className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-8">
                    {/* Order Information Bento Card */}
                    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2.5rem] p-8 shadow-sm space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--primary))]/5 rounded-full blur-2xl -mr-16 -mt-16" />
                        
                        <h3 className="text-sm font-extrabold text-[hsl(var(--foreground))] uppercase tracking-widest flex items-center gap-3">
                            <Tag className="w-4 h-4 text-[hsl(var(--primary))]" /> Order Summary
                        </h3>

                        <div className="space-y-6">
                            <div className="group">
                                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block mb-1 opacity-60">Preferred Vendor</span>
                                <p className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-tight">{request.vendor || 'NO PREFERENCE'}</p>
                            </div>
                            <div className="h-px w-full bg-[hsl(var(--border))]" />
                            <div>
                                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block mb-1 opacity-60">Installation Service</span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${(request as any).requiresInstallation ? 'bg-[hsl(var(--primary))] animate-pulse' : 'bg-muted'}`} />
                                    <p className="text-sm font-bold text-[hsl(var(--foreground))] uppercase tracking-tight">
                                        {(request as any).requiresInstallation ? 'IT SUPPORT REQUIRED' : 'SELF-INSTALLED'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isOwner && currentStatus === IctBudgetRealizationStatus.PENDING && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <button
                                onClick={async () => {
                                    if (window.confirm('Are you sure you want to cancel this request?')) {
                                        try {
                                            await cancelMutation.mutateAsync(request.id);
                                            toast.success('Request cancelled successfully');
                                        } catch(e) {
                                            toast.error('Failed to cancel request');
                                        }
                                    }
                                }}
                                disabled={cancelMutation.isPending}
                                className="w-full py-4 rounded-xl border border-[hsl(var(--error-500))]/30 text-[hsl(var(--error-500))] bg-[hsl(var(--error-500))]/5 hover:bg-[hsl(var(--error-500))] hover:text-white transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out font-extrabold text-[10px] uppercase tracking-widest active:scale-95 flex justify-center items-center gap-2"
                            >
                                {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                Cancel Request
                            </button>
                        </div>
                    )}

                    {canApprove && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <ApprovalPanel 
                                onApprove={async (notes) => await approveMutation.mutateAsync({ id: request.id, approved: true, superiorNotes: notes })} 
                                onReject={async (notes) => await approveMutation.mutateAsync({ id: request.id, approved: false, superiorNotes: notes })}
                                isSubmitting={approveMutation.isPending}
                            />
                        </div>
                    )}

                    {canProcessPurchasing && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <PurchasingPanel 
                                currentStatus={currentStatus || IctBudgetRealizationStatus.PENDING}
                                onStartPurchasing={async () => await startPurchasingMutation.mutateAsync(request.id)}
                                onRealize={async (dto) => await realizeMutation.mutateAsync({ id: request.id, ...dto })}
                                isSubmitting={startPurchasingMutation.isPending || realizeMutation.isPending}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
