import React, { useState } from 'react';
import { Package, Check, X, Loader2 } from 'lucide-react';

interface ArrivedConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { deliveryNote: string; receiverName: string }) => void;
    isSubmitting: boolean;
}

export const ArrivedConfirmation: React.FC<ArrivedConfirmationProps> = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
    const [deliveryNote, setDeliveryNote] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        setIsSuccess(true);
        setTimeout(() => {
            onConfirm({ deliveryNote, receiverName });
            setIsSuccess(false);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-[opacity,transform,colors] duration-200 ease-out shadow-lg ${
                            isSuccess 
                                ? 'bg-[hsl(var(--success-500))]/20 text-[hsl(var(--success-500))] scale-110 shadow-success-500/20' 
                                : 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20 shadow-primary/10'
                        }`}>
                            {isSuccess ? <Check className="w-7 h-7 animate-in zoom-in" /> : <Package className="w-7 h-7 animate-bounce" style={{ animationDuration: '2s' }} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-extrabold text-[hsl(var(--foreground))] uppercase tracking-tight">Confirm Arrival</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Mark items as received</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        disabled={isSubmitting} 
                        className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-[hsl(var(--foreground))] transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6 mb-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest ml-1">Receiver Name (Optional)</label>
                        <input
                            type="text"
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                            className="w-full px-5 py-3.5 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-2xl text-sm font-bold text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-colors duration-150 placeholder:opacity-30"
                            placeholder="e.g. John Doe (Security)"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest ml-1">Delivery Notes (Optional)</label>
                        <textarea
                            value={deliveryNote}
                            onChange={(e) => setDeliveryNote(e.target.value)}
                            className="w-full px-5 py-4 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-2xl text-sm font-medium text-[hsl(var(--foreground))] placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-colors duration-150 resize-none min-h-[100px]"
                            placeholder="Tracking number, package condition, etc..."
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-muted border border-[hsl(var(--border))] text-muted-foreground font-extrabold rounded-2xl hover:bg-muted/80 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out text-xs uppercase tracking-widest active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 font-extrabold rounded-2xl transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out text-xs uppercase tracking-widest shadow-lg active:scale-95 ${
                            isSuccess 
                                ? 'bg-[hsl(var(--success-500))] text-white shadow-success-500/20'
                                : 'bg-[hsl(var(--primary))] text-white hover:brightness-110 shadow-primary/20'
                        }`}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSuccess ? 'Confirmed!' : 'Confirm Receipt'}
                    </button>
                </div>
            </div>
        </div>
    );
};
