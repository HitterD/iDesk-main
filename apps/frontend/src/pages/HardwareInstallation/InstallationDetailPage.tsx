import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/stores/useAuth';
import { useInstallationDetail } from '../../hooks/useHardwareInstallation';
import { useAssignTicket } from '../../features/ticket-board/hooks/useTickets';
import { AssigneeSelect } from '../../features/ticket-board/components/sidebar/AssigneeSelect';
import { Button } from '../../components/ui/button';
import { ArrowLeft, MonitorSmartphone, Calendar, MapPin, User, CheckCircle2, CircleDashed, Wrench, AlertCircle, Loader2, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ActivityTimeline } from '../../features/request-center/components/ActivityTimeline';

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'RESOLVED':
            return <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Completed</div>;
        case 'IN_PROGRESS':
            return <div className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1.5"><Wrench className="w-3 h-3" /> In_Progress</div>;
        default:
            return <div className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center gap-1.5"><CircleDashed className="w-3 h-3" /> Scheduled</div>;
    }
};

export default function InstallationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    const isAgent = ['ADMIN', 'MANAGER', 'AGENT', 'AGENT_OPERATIONAL_SUPPORT', 'AGENT_ADMIN', 'AGENT_ORACLE'].includes(user?.role || '');

    const getBasePath = () => {
        if (user?.role === 'MANAGER') return '/manager';
        if (user?.role === 'USER') return '/client';
        return '';
    };

    const { data: detail, isLoading, error } = useInstallationDetail(id!);
    const assignMutation = useAssignTicket();
    
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                <p className="text-[hsl(var(--primary))] mt-4 text-sm font-semibold">Loading details...</p>
            </div>
        );
    }
    
    if (error || !detail) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-[60vh]">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold">Record Not Found</h2>
                <p className="text-muted-foreground mt-2 mb-6 text-sm">The requested hardware installation record could not be found.</p>
                <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl font-semibold">Go Back</Button>
            </div>
        );
    }

    const handleAssign = (agentId: string) => {
        if (!agentId) return;
        assignMutation.mutate({ ticketId: detail.id, assigneeId: agentId }, {
            onSuccess: () => {
                toast.success('Technician assigned successfully');
                queryClient.invalidateQueries({ queryKey: ['ict-budget-installation-detail', id] });
            },
            onError: () => toast.error('Failed to assign technician')
        });
    };

    const updateStatus = async (status: string) => {
        setIsUpdatingStatus(true);
        try {
            await api.patch(`/tickets/${detail.id}`, { status });
            toast.success(`Status updated to ${status.replace('_', ' ')}`);
            queryClient.invalidateQueries({ queryKey: ['ict-budget-installation-detail', id] });
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-muted/50 hover:bg-muted">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-2.5 py-0.5 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] font-extrabold tracking-widest rounded-md uppercase">
                                #{detail.ticketNumber || detail.id.substring(0, 8)}
                            </span>
                            {getStatusBadge(detail.status)}
                        </div>
                        <h1 className="text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tighter">
                            {detail.title}
                        </h1>
                    </div>
                </div>
                
                {isAgent && (
                    <div className="flex items-center gap-3">
                        {detail.status === 'TODO' && (
                            <Button 
                                onClick={() => updateStatus('IN_PROGRESS')} 
                                disabled={isUpdatingStatus}
                                className="bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90 rounded-xl px-6 h-11 font-semibold shadow-sm transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out"
                            >
                                {isUpdatingStatus && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Wrench className="w-4 h-4 mr-2" /> Start Work
                            </Button>
                        )}
                        {detail.status === 'IN_PROGRESS' && (
                            <Button 
                                onClick={() => updateStatus('RESOLVED')} 
                                disabled={isUpdatingStatus}
                                className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-6 h-11 font-semibold shadow-sm transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out"
                            >
                                {isUpdatingStatus && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Done
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (8/12) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Installation Info */}
                    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[hsl(var(--border))] bg-muted/10">
                            <h2 className="text-xs font-extrabold text-[hsl(var(--foreground))] uppercase tracking-widest flex items-center gap-2">
                                <MonitorSmartphone className="w-4 h-4 text-[hsl(var(--primary))]" />
                                Specifications
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                            <div className="space-y-1.5 border-l-2 border-[hsl(var(--primary))] pl-4">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hardware Type</span>
                                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{detail.hardwareType || 'N/A'}</p>
                            </div>
                            <div className="space-y-1.5 border-l-2 border-[hsl(var(--primary))] pl-4">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Location / Site</span>
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--foreground))]">
                                    <MapPin className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                                    {detail.site?.name || 'TBD'}
                                </div>
                            </div>
                            <div className="space-y-1.5 border-l-2 border-[hsl(var(--primary))] pl-4">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Requester</span>
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--foreground))]">
                                    <User className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                                    {detail.requester?.fullName || 'System'}
                                </div>
                            </div>
                            <div className="space-y-1.5 border-l-2 border-[hsl(var(--primary))] pl-4">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Origin Request</span>
                                {detail.ictBudgetRequest ? (
                                    <div className="mt-1">
                                        <button 
                                            onClick={() => navigate(`${getBasePath()}/hardware-requests/${detail.ictBudgetRequest?.id}`)}
                                            className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline transition-colors text-left"
                                        >
                                            {detail.ictBudgetRequest.title || 'View Request'}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm font-semibold text-muted-foreground">Not Linked</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Details */}
                    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[hsl(var(--border))] bg-muted/10">
                            <h2 className="text-xs font-extrabold text-[hsl(var(--foreground))] uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[hsl(var(--primary))]" />
                                Schedule Data
                            </h2>
                        </div>
                        {detail.schedule ? (
                            <div className="flex flex-col">
                                <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[hsl(var(--border))]">
                                    <div className="p-6 border-r border-[hsl(var(--border))]">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Target Date</span>
                                        <p className="text-base font-bold text-[hsl(var(--foreground))]">
                                            {detail.schedule.scheduledDate ? format(new Date(detail.schedule.scheduledDate), 'dd MMM yyyy') : 'TBD'}
                                        </p>
                                    </div>
                                    <div className="p-6">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Time Slot</span>
                                        <div className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md text-sm font-semibold text-[hsl(var(--foreground))]">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            {detail.schedule.scheduledTimeSlot || (detail.scheduledTime ? `${detail.scheduledTime}` : 'TBD')}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    <div className="p-6 border-r border-[hsl(var(--border))]">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Target Item</span>
                                        <div className="inline-flex items-center gap-1.5 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] px-2.5 py-1 rounded-md text-sm font-semibold">
                                            {detail.schedule.itemName}
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Status</span>
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-widest ${
                                            detail.schedule.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-500' :
                                            detail.schedule.status === 'COMPLETED' ? 'bg-[hsl(var(--success-500))]/10 text-[hsl(var(--success-500))]' :
                                            detail.schedule.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                                            'bg-muted text-muted-foreground'
                                        }`}>
                                            {detail.schedule.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/10">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <AlertCircle className="w-6 h-6 text-amber-500 opacity-80" />
                                </div>
                                <span className="text-sm font-semibold">No schedule data available</span>
                            </div>
                        )}
                    </div>
                    
                </div>

                {/* Right Column (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Assignment Panel */}
                    <div className="bg-[hsl(var(--primary))] text-primary-foreground rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-bl-[100px]" />
                        <div className="px-6 py-4 border-b border-primary-foreground/10 relative z-10">
                            <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4" /> Assignment
                            </h2>
                        </div>
                        <div className="p-6 space-y-6 relative z-10 bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Technician</span>
                                {detail.assignedTo ? (
                                    <div className="flex items-center gap-3 p-3 bg-muted/20 border border-[hsl(var(--border))] rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center text-sm font-extrabold shadow-inner">
                                            {detail.assignedTo.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[hsl(var(--foreground))]">{detail.assignedTo.fullName}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Technician</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 border border-dashed border-amber-500/30 rounded-xl text-center bg-amber-500/5">
                                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest flex justify-center items-center gap-1">
                                            <AlertCircle className="w-4 h-4" /> Unassigned
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            {isAgent && (
                                <div className="space-y-2 pt-4 border-t border-[hsl(var(--border))]">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reassign Technician</span>
                                    <AssigneeSelect 
                                        value={detail.assignedTo?.id} 
                                        onChange={handleAssign}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Activity Timeline */}
                    <ActivityTimeline 
                        activities={detail.activities || []} 
                    />
                </div>
            </div>
        </div>
    );
}
