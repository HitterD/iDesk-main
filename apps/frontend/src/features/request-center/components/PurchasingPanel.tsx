import React, { useState } from 'react';
import { ShoppingCart, PackageCheck, Package, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { IctBudgetRealizationStatus } from '../api/ict-budget.api';

interface PurchasingPanelProps {
    currentStatus: IctBudgetRealizationStatus;
    onStartPurchasing: () => void;
    onRealize: (dto: { purchaseOrderNumber: string; invoiceNumber: string; realizationNotes: string }) => void;
    isSubmitting?: boolean;
}

export const PurchasingPanel: React.FC<PurchasingPanelProps> = ({ 
    currentStatus, 
    onStartPurchasing, 
    onRealize, 
    isSubmitting 
}) => {
    const [poNumber, setPoNumber] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [notes, setNotes] = useState('');

    const isApproved = currentStatus === IctBudgetRealizationStatus.APPROVED;
    const isPurchasing = currentStatus === IctBudgetRealizationStatus.PURCHASING;
    const isPartiallyArrived = currentStatus === IctBudgetRealizationStatus.PARTIALLY_ARRIVED;
    const isArrived = currentStatus === IctBudgetRealizationStatus.ARRIVED;

    if (!isApproved && !isPurchasing && !isPartiallyArrived && !isArrived) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-[hsl(var(--foreground))] uppercase tracking-widest flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[hsl(var(--primary))]" />
                    Procurement Process
                </h3>
            </div>

            {/* State: APPROVED -> Start Purchasing */}
            {isApproved && (
                <div className="flex flex-col items-center py-8 text-center border border-[hsl(var(--primary))]/20 bg-[hsl(var(--primary))]/5 rounded-3xl backdrop-blur-sm shadow-sm">
                    <div className="w-16 h-16 bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 rounded-2xl flex items-center justify-center mb-5 text-[hsl(var(--primary))] shadow-lg shadow-primary/5 transition-transform hover:scale-105 duration-300">
                        <ShoppingCart className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-extrabold text-[hsl(var(--foreground))] mb-2 uppercase tracking-tight">Start Procurement</h4>
                    <p className="text-xs text-muted-foreground mb-8 px-8 leading-relaxed font-medium max-w-[280px]">
                        Click the button below to initiate price scouting and order placement with vendors.
                    </p>
                    <button
                        onClick={onStartPurchasing}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-3 px-10 py-4 bg-[hsl(var(--primary))] text-primary-foreground font-extrabold rounded-2xl hover:bg-[hsl(var(--primary))]/90 hover:shadow-xl hover:shadow-primary/20 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out text-sm disabled:opacity-50 active:scale-95 group"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        Begin Purchasing
                    </button>
                </div>
            )}

            {/* State: PURCHASING -> Waiting for Items */}
            {isPurchasing && (
                <div className="flex flex-col items-center py-8 text-center border border-[hsl(var(--warning-500))]/20 bg-[hsl(var(--warning-500))]/5 rounded-3xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-[hsl(var(--warning-500))]/10 border border-[hsl(var(--warning-500))]/20 rounded-2xl flex items-center justify-center mb-5 text-[hsl(var(--warning-500))] shadow-lg shadow-warning-500/5">
                        <Package className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-extrabold text-[hsl(var(--foreground))] mb-2 uppercase tracking-tight">Awaiting Shipment</h4>
                    <p className="text-xs text-muted-foreground mb-4 px-8 leading-relaxed font-medium">
                        Orders are currently being processed by the vendor.
                    </p>
                    <div className="mx-6 px-4 py-3 bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] rounded-xl text-[10px] text-muted-foreground font-bold uppercase tracking-wider leading-relaxed">
                        Mark items as arrived individually in the <span className="text-[hsl(var(--primary))]">Shipment Items</span> panel.
                    </div>
                </div>
            )}

            {/* State: ARRIVED / PARTIALLY_ARRIVED -> Realization Form */}
            {(isArrived || isPartiallyArrived) && (
                <div className="space-y-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-3xl shadow-sm">
                    <div className="p-4 bg-[hsl(var(--success-500))]/10 border border-[hsl(var(--success-500))]/20 rounded-2xl flex items-start gap-3">
                        <PackageCheck className="w-5 h-5 text-[hsl(var(--success-500))] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[hsl(var(--success-500))] font-bold leading-relaxed uppercase tracking-tight">
                            {isPartiallyArrived 
                                ? "Partial Arrival. You can complete realization now or wait for remaining items." 
                                : "All items arrived. Complete the PO and Invoice details to finish procurement."}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground ml-1">Purchase Order #</label>
                            <input
                                type="text"
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                                className="w-full px-4 py-3.5 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-2xl text-sm font-bold text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-colors duration-150 placeholder:opacity-30"
                                placeholder="PO-XXXX-XXXX"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground ml-1">Invoice #</label>
                            <input
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                className="w-full px-4 py-3.5 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-2xl text-sm font-bold text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-colors duration-150 placeholder:opacity-30"
                                placeholder="INV-XXXX-XXXX"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground ml-1">Realization Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-3.5 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-2xl text-sm font-medium text-[hsl(var(--foreground))] placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-colors duration-150 resize-none min-h-[100px]"
                            placeholder="Add delivery details or final notes..."
                        />
                    </div>

                    <button
                        onClick={() => onRealize({ purchaseOrderNumber: poNumber, invoiceNumber, realizationNotes: notes })}
                        disabled={isSubmitting || !poNumber || !invoiceNumber}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4.5 bg-[hsl(var(--success-500))] text-white font-extrabold rounded-2xl hover:brightness-110 hover:shadow-xl hover:shadow-success-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out text-sm mt-2 uppercase tracking-widest active:scale-[0.98]"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Complete Realization
                    </button>
                </div>
            )}
        </div>
    );
};
