import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { RequestWizard } from '../components/RequestWizard';
import { IctBudgetRequestForm, IctBudgetFormData } from '../components/IctBudgetRequestForm';
import { useCreateIctBudget, IctBudgetRequestType, IctBudgetCategory } from '../api/ict-budget.api';
import { generateId } from '@/lib/utils';

const WIZARD_STEPS = [
    { id: 1, title: 'Formulir Request', description: 'Lengkapi data pengadaan' },
    { id: 2, title: 'Review & Submit', description: 'Periksa kembali data Anda' }
];

export const HardwareRequestCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const createIctBudget = useCreateIctBudget();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [budgetData, setBudgetData] = useState<IctBudgetFormData>({
        requestType: IctBudgetRequestType.PURCHASE,
        budgetCategory: IctBudgetCategory.HARDWARE,
        items: [{ id: generateId(), name: '', isArrived: false }],
        vendor: '',
        requiresInstallation: false
    });

    const handleNext = () => {
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            await createIctBudget.mutateAsync(budgetData);
            toast.success('ICT Budget request has been submitted successfully!');
            navigate(-1);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canContinue = () => {
        if (currentStep === 1) {
            return budgetData.items.length > 0 && budgetData.items.every(i => i.name.trim() !== '');
        }
        return true;
    };

    return (
        <div className="max-w-6xl mx-auto py-12 px-8 h-full flex flex-col space-y-12 animate-in fade-in duration-700">
            {/* Elegant Header */}
            <div className="flex items-center gap-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-4 rounded-2xl bg-white border-2 border-[hsl(var(--border))] text-muted-foreground hover:text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]/30 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-90 shadow-sm"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-[hsl(var(--foreground))] tracking-tighter uppercase">New Request</h1>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Hardware & Software Procurement</p>
                </div>
            </div>

            <RequestWizard
                steps={WIZARD_STEPS}
                currentStep={currentStep}
                onNext={handleNext}
                onBack={handleBack}
                canNext={canContinue()}
                isLastStep={currentStep === 2}
                isSubmitting={isSubmitting}
                onComplete={handleComplete}
            >
                {/* Step 1: Form */}
                {currentStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                        <IctBudgetRequestForm 
                            data={budgetData} 
                            onChange={(update) => setBudgetData(prev => ({ ...prev, ...update }))} 
                        />
                    </div>
                )}

                {/* Step 2: Review */}
                {currentStep === 2 && (
                    <div className="space-y-10 animate-in zoom-in-95 duration-700">
                        <div className="flex items-center gap-8 p-10 bg-blue-50/50 border-2 border-blue-100 rounded-[3rem] shadow-sm">
                            <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-xl shadow-blue-500/5">
                                <CheckCircle2 className="w-10 h-10 text-blue-600" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-2xl font-black text-[hsl(var(--foreground))] uppercase tracking-tight">Review Your Request</h4>
                                <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em]">Almost there. Please verify your details.</p>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-[hsl(var(--border))] rounded-[3rem] overflow-hidden shadow-sm">
                            <div className="px-10 py-8 bg-muted/20 border-b-2 border-[hsl(var(--border))] flex justify-between items-center">
                                <span className="text-[10px] font-black text-[hsl(var(--foreground))] uppercase tracking-[0.2em]">Procurement Summary</span>
                                <span className="px-5 py-2 rounded-xl text-[10px] font-black bg-blue-600 text-white uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20">
                                    {budgetData.requestType}
                                </span>
                            </div>
                            <div className="p-10 space-y-12">
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block">Category Type</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-sm text-[hsl(var(--foreground))] font-black uppercase tracking-tight">{budgetData.budgetCategory}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block">Item Count</span>
                                        <span className="text-sm font-black text-blue-600 uppercase tracking-tight">{budgetData.items.length} Total Units</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block">Requested Items List</span>
                                    <div className="grid grid-cols-1 gap-4">
                                        {budgetData.items.map((item, idx) => (
                                            <div key={item.id} className="flex items-center gap-6 p-6 bg-muted/10 border-2 border-[hsl(var(--border))] rounded-[1.5rem] group hover:border-blue-500/30 hover:bg-white transition-colors duration-150 ">
                                                <span className="w-10 h-10 rounded-xl bg-white border-2 border-[hsl(var(--border))] flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-colors duration-150">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-sm text-[hsl(var(--foreground))] font-black uppercase tracking-tight">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-muted/10 border-2 border-dashed border-[hsl(var(--border))] rounded-[2.5rem] flex gap-6 items-start">
                            <AlertCircle className="w-6 h-6 text-blue-600/40 shrink-0 mt-1" />
                            <p className="text-[10px] text-[hsl(var(--foreground))] leading-loose font-black uppercase tracking-[0.2em]">
                                By clicking Submit, you confirm that these items are required for operations. The ICT team will scout for pricing and initiate approval flows with your superior.
                            </p>
                        </div>
                    </div>
                )}
            </RequestWizard>
        </div>
    );
};
