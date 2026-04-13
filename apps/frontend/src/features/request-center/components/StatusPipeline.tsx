import React from 'react';
import { Check, ClipboardList, ShieldCheck, ShoppingCart, Package, Sparkles } from 'lucide-react';
import { IctBudgetRealizationStatus } from '../api/ict-budget.api';

interface StatusStep {
    status: IctBudgetRealizationStatus;
    label: string;
    description?: string;
    icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
}

const ICT_BUDGET_STEPS: StatusStep[] = [
    { status: IctBudgetRealizationStatus.PENDING, label: 'Submitted', description: 'Menunggu approval', icon: ClipboardList },
    { status: IctBudgetRealizationStatus.APPROVED, label: 'Approved', description: 'Permintaan disetujui', icon: ShieldCheck },
    { status: IctBudgetRealizationStatus.PURCHASING, label: 'Purchasing', description: 'Proses pembelian', icon: ShoppingCart },
    { status: IctBudgetRealizationStatus.ARRIVED, label: 'Arrived', description: 'Barang tiba', icon: Package },
    { status: IctBudgetRealizationStatus.REALIZED, label: 'Completed', description: 'Selesai & diserahkan', icon: Sparkles },
];

interface StatusPipelineProps {
    currentStatus: IctBudgetRealizationStatus;
    className?: string;
}

export const StatusPipeline: React.FC<StatusPipelineProps> = ({ currentStatus, className = '' }) => {
    // Treat REJECTED as stopped at step 1
    const getActiveIndex = () => {
        if (currentStatus === IctBudgetRealizationStatus.REJECTED) return 1;
        if (currentStatus === IctBudgetRealizationStatus.PARTIALLY_ARRIVED) return 3; // Treat as "Arrived" step
        return ICT_BUDGET_STEPS.findIndex(step => step.status === currentStatus);
    };

    const currentIndex = getActiveIndex();

    return (
        <div className={`w-full py-8 ${className}`}>
            <div className="relative flex items-center justify-between mx-4 md:mx-12">
                {/* Background Line */}
                <div className="absolute left-0 top-6 h-1 w-full -translate-y-1/2 rounded-full bg-[hsl(var(--border))] opacity-50 dark:opacity-20" />
                
                {/* Progress Line */}
                <div 
                    className={`absolute left-0 top-6 h-1 -translate-y-1/2 rounded-full transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out -out ${
                        currentStatus === IctBudgetRealizationStatus.REJECTED 
                            ? 'bg-[hsl(var(--error-500))]' 
                            : 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]'
                    }`}
                    style={{ width: `${(currentIndex / (ICT_BUDGET_STEPS.length - 1)) * 100}%` }}
                />

                {/* Steps */}
                {ICT_BUDGET_STEPS.map((step, index) => {
                    const isCompleted = index < currentIndex && currentStatus !== IctBudgetRealizationStatus.REJECTED;
                    const isActive = index === currentIndex;
                    const isRejectedNode = currentStatus === IctBudgetRealizationStatus.REJECTED && index === 1;

                    const Icon = step.icon;

                    return (
                        <div key={step.status} className="relative z-10 flex flex-col items-center group">
                            {/* Icon Container */}
                            <div 
                                className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-[opacity,transform,colors] duration-200 ease-out shadow-sm ${
                                    isCompleted 
                                        ? 'bg-[hsl(var(--primary))] text-primary-foreground scale-110 shadow-lg shadow-primary/20' 
                                        : isActive 
                                            ? isRejectedNode
                                                ? 'bg-[hsl(var(--error-500))] text-white ring-4 ring-error-500/20'
                                                : 'bg-[hsl(var(--card))] text-[hsl(var(--primary))] border-2 border-[hsl(var(--primary))] ring-4 ring-primary/20' 
                                            : 'bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-muted-foreground'
                                }`}
                            >
                                {isActive && !isRejectedNode && (
                                    <div className="absolute inset-0 rounded-full border-2 border-[hsl(var(--primary))]/50 animate-ping" />
                                )}
                                
                                {isCompleted ? (
                                    <Check className="h-6 w-6 stroke-[3px]" />
                                ) : (
                                    <Icon className={`h-5 w-5 ${isActive ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} style={{ animationDuration: '2s' }} />
                                )}
                            </div>
                            
                            {/* Label & Description */}
                            <div className="absolute top-16 flex w-32 flex-col items-center text-center">
                                <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${
                                    isActive 
                                        ? isRejectedNode ? 'text-[hsl(var(--error-500))]' : 'text-[hsl(var(--primary))]' 
                                        : isCompleted 
                                            ? 'text-[hsl(var(--foreground))]' 
                                            : 'text-muted-foreground'
                                }`}>
                                    {isRejectedNode ? 'Rejected' : step.label}
                                </span>
                                {(isActive || isCompleted) && !isRejectedNode && (
                                    <span className="mt-1 text-[10px] text-muted-foreground font-medium leading-tight opacity-80 uppercase tracking-widest px-2">
                                        {step.description}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Case for REJECTED status extra info */}
            {currentStatus === IctBudgetRealizationStatus.REJECTED && (
                <div className="mt-20 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="rounded-xl border border-[hsl(var(--error-500))]/30 bg-[hsl(var(--error-500))]/10 px-6 py-3 text-sm font-bold text-[hsl(var(--error-500))] shadow-lg shadow-error-500/5">
                        <span className="flex items-center gap-2 uppercase tracking-tight">
                            ⚠️ Request has been rejected and stopped at this stage
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
