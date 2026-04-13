import React, { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare, AlertTriangle } from 'lucide-react';

interface ApprovalPanelProps {
    onApprove: (notes: string) => void;
    onReject: (notes: string) => void;
    isSubmitting?: boolean;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ onApprove, onReject, isSubmitting }) => {
    const [notes, setNotes] = useState('');
    const [showConfirm, setShowConfirm] = useState<'Approve' | 'Reject' | null>(null);

    const handleAction = () => {
        if (showConfirm === 'Approve') onApprove(notes);
        if (showConfirm === 'Reject') onReject(notes);
        setShowConfirm(null);
    };

    return (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-[hsl(var(--border))] bg-muted/30 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[hsl(var(--foreground))] flex items-center gap-2 uppercase tracking-widest">
                    <CheckCircle className="w-4 h-4 text-[hsl(var(--primary))]" />
                    Approval Actions
                </h3>
            </div>

            <div className="p-7 space-y-7">
                <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground ml-1 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[hsl(var(--primary))]/50" /> Approval Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-4 bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] rounded-2xl text-sm font-medium text-[hsl(var(--foreground))] placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-colors duration-150 resize-none min-h-[120px]"
                        placeholder="Add your comments here (optional for approval, recommended for rejection)..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <button
                        onClick={() => setShowConfirm('Reject')}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-3 px-6 py-4 bg-muted border border-[hsl(var(--border))] text-[hsl(var(--error-500))] font-extrabold rounded-2xl hover:bg-[hsl(var(--error-500))]/10 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out text-xs uppercase tracking-widest active:scale-95"
                    >
                        <XCircle className="w-4 h-4" />
                        Reject
                    </button>
                    <button
                        onClick={() => setShowConfirm('Approve')}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-3 px-6 py-4 bg-[hsl(var(--primary))] text-primary-foreground font-extrabold rounded-2xl hover:brightness-110 hover:shadow-xl hover:shadow-primary/20 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out text-xs uppercase tracking-widest active:scale-95"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Approve Request
                    </button>
                </div>
            </div>

            {/* Confirmation Modal Overlay */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-transform hover:scale-110 duration-500 shadow-lg ${
                            showConfirm === 'Approve' 
                                ? 'bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]' 
                                : 'bg-[hsl(var(--error-500))]/10 border border-[hsl(var(--error-500))]/20 text-[hsl(var(--error-500))]'
                        }`}>
                            {showConfirm === 'Approve' ? <CheckCircle className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                        </div>
                        
                        <h4 className="text-2xl font-extrabold text-[hsl(var(--foreground))] text-center mb-3 uppercase tracking-tight">
                            Confirm {showConfirm}
                        </h4>
                        <p className="text-muted-foreground text-center text-sm mb-10 leading-relaxed font-medium px-4">
                            Are you sure you want to <span className="text-[hsl(var(--foreground))] font-bold">{showConfirm.toLowerCase()}</span> this hardware request? This action cannot be undone.
                        </p>

                        <div className="grid grid-cols-2 gap-5">
                            <button
                                onClick={() => setShowConfirm(null)}
                                className="px-6 py-4 bg-muted border border-[hsl(var(--border))] text-muted-foreground font-extrabold rounded-2xl hover:bg-[hsl(var(--muted))]/80 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out text-xs uppercase tracking-widest active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                className={`px-6 py-4 font-extrabold rounded-2xl transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 ${
                                    showConfirm === 'Approve' 
                                        ? 'bg-[hsl(var(--primary))] hover:brightness-110 shadow-primary/20' 
                                        : 'bg-[hsl(var(--error-500))] hover:brightness-110 shadow-error-500/20'
                                }`}
                            >
                                Confirm {showConfirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
