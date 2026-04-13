import React from 'react';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';

interface WizardStep {
    id: number;
    title: string;
    description: string;
}

interface RequestWizardProps {
    steps: WizardStep[];
    currentStep: number;
    children: React.ReactNode;
    onNext: () => void;
    onBack: () => void;
    canNext?: boolean;
    isLastStep?: boolean;
    isSubmitting?: boolean;
    onComplete: () => void;
}

export const RequestWizard: React.FC<RequestWizardProps> = ({
    steps,
    currentStep,
    children,
    onNext,
    onBack,
    canNext = true,
    isLastStep = false,
    isSubmitting = false,
    onComplete,
}) => {
    return (
        <div className="flex flex-col h-full bg-white rounded-[3rem] border border-[hsl(var(--border))] shadow-xl shadow-black/5 overflow-hidden transition-[opacity,transform,colors] duration-200 ease-out ">
            {/* Header / Progress Indicator */}
            <div className="px-10 py-12 border-b border-[hsl(var(--border))] bg-muted/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[hsl(var(--primary))]/5" />
                
                <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                    {/* Connection Lines */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-[hsl(var(--border))] rounded-full z-0 opacity-30" />
                    
                    {/* Active Progress Line */}
                    <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[hsl(var(--primary))] rounded-full z-0 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out -out"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />
                    
                    {steps.map((step, index) => {
                        const isCompleted = index + 1 < currentStep;
                        const isActive = index + 1 === currentStep;
                        
                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div 
                                    className={`flex h-14 w-14 items-center justify-center rounded-[1.5rem] transition-[opacity,transform,colors] duration-200 ease-out shadow-sm border-2 ${
                                        isCompleted 
                                            ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-white shadow-xl shadow-primary/20 scale-110' 
                                            : isActive 
                                                ? 'bg-white border-[hsl(var(--primary))] text-[hsl(var(--primary))] shadow-2xl shadow-primary/10 ring-8 ring-primary/5 scale-110' 
                                                : 'bg-white border-[hsl(var(--border))] text-muted-foreground opacity-60'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <Check className="h-6 w-6 stroke-[4px]" />
                                    ) : (
                                        <span className="text-base font-black">{index + 1}</span>
                                    )}
                                </div>
                                <div className="absolute top-20 w-48 text-center">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-[opacity,transform,colors] duration-200 ease-out ${
                                        isActive ? 'text-[hsl(var(--primary))]' : isCompleted ? 'text-[hsl(var(--foreground))]' : 'text-muted-foreground opacity-40'
                                    }`}>
                                        {step.title}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow p-12 mt-4 overflow-y-auto min-h-[500px] custom-scrollbar">
                <div className="max-w-4xl mx-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </div>

            {/* Footer / Navigation */}
            <div className="px-12 py-10 border-t border-[hsl(var(--border))] bg-white/50 backdrop-blur-xl">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <button
                        onClick={onBack}
                        disabled={currentStep === 1 || isSubmitting}
                        className={`flex items-center gap-4 px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-95 ${
                            currentStep === 1 || isSubmitting
                                ? 'opacity-0 pointer-events-none'
                                : 'text-muted-foreground hover:bg-muted/50 border-2 border-transparent hover:border-[hsl(var(--border))]'
                        }`}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Go Back
                    </button>

                    <div className="flex items-center gap-6">
                        {!isLastStep ? (
                            <button
                                onClick={onNext}
                                disabled={!canNext || isSubmitting}
                                className={`group flex items-center gap-4 px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-95 shadow-2xl ${
                                    canNext && !isSubmitting
                                        ? 'bg-[hsl(var(--primary))] text-white hover:brightness-110 shadow-primary/30 border-2 border-primary/20'
                                        : 'bg-muted/50 text-muted-foreground cursor-not-allowed border-2 border-[hsl(var(--border))]'
                                }`}
                            >
                                Continue
                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                            </button>
                        ) : (
                            <button
                                onClick={onComplete}
                                disabled={isSubmitting}
                                className={`group flex items-center gap-4 px-14 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-95 shadow-2xl ${
                                    !isSubmitting
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30 border-2 border-blue-400/20'
                                        : 'bg-muted/50 text-muted-foreground cursor-not-allowed border-2 border-[hsl(var(--border))]'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <span>Submit Request</span>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
