import React from 'react';
import { ShoppingCart, Tag, Package, Plus, Trash2, RefreshCw, KeyRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { IctBudgetRequestType, IctBudgetCategory } from '../api/ict-budget.api';
import { generateId } from '@/lib/utils';

export interface IctBudgetFormData {
    requestType: IctBudgetRequestType;
    budgetCategory: IctBudgetCategory;
    items: { id: string; name: string; isArrived: boolean }[];
    vendor?: string;
    requiresInstallation: boolean;
}

interface IctBudgetRequestFormProps {
    data: IctBudgetFormData;
    onChange: (data: Partial<IctBudgetFormData>) => void;
}

// Map Request Type to Color & Icon
const REQUEST_TYPE_CONFIG = {
    [IctBudgetRequestType.PURCHASE]: {
        label: 'Purchase',
        icon: ShoppingCart,
        accent: 'hsl(var(--primary))',
        bg: 'bg-blue-50/50',
        border: 'border-blue-200',
        activeBg: 'bg-blue-50',
        activeText: 'text-blue-700',
        activeBorder: 'border-blue-500',
        dot: 'bg-blue-500'
    },
    [IctBudgetRequestType.RENEWAL]: {
        label: 'Renewal',
        icon: RefreshCw,
        accent: 'hsl(var(--warning-500))',
        bg: 'bg-amber-50/50',
        border: 'border-amber-200',
        activeBg: 'bg-amber-50',
        activeText: 'text-amber-700',
        activeBorder: 'border-amber-500',
        dot: 'bg-amber-500'
    },
    [IctBudgetRequestType.LICENSE]: {
        label: 'License',
        icon: KeyRound,
        accent: 'hsl(var(--success-500))',
        bg: 'bg-teal-50/50',
        border: 'border-teal-200',
        activeBg: 'bg-teal-50',
        activeText: 'text-teal-700',
        activeBorder: 'border-teal-500',
        dot: 'bg-teal-500'
    }
};

export const IctBudgetRequestForm: React.FC<IctBudgetRequestFormProps> = ({ data, onChange }) => {
    const handleAddItem = () => {
        const newItem = { id: generateId(), name: '', isArrived: false };
        onChange({
            items: [...data.items, newItem]
        });
    };

    const handleRemoveItem = (id: string) => {
        // Prevent removing the last item to keep at least one row
        if (data.items.length <= 1) return;
        
        onChange({
            items: data.items.filter(item => item.id !== id)
        });
    };

    const handleItemNameChange = (id: string, newName: string) => {
        onChange({
            items: data.items.map(item => item.id === id ? { ...item, name: newName } : item)
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Section 1: Request Type */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))] font-black text-xl shadow-sm">
                        1
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-[hsl(var(--foreground))]">Request Type</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Select the nature of your procurement request.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.values(IctBudgetRequestType).map(type => {
                        const config = REQUEST_TYPE_CONFIG[type];
                        const Icon = config.icon;
                        const isActive = data.requestType === type;

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => onChange({ requestType: type })}
                                className={`group relative p-6 rounded-[2rem] border-2 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out flex flex-col items-center gap-4 active:scale-95 text-center ${
                                    isActive
                                        ? `${config.activeBg} ${config.activeBorder} ${config.activeText} shadow-xl shadow-primary/5 ring-4 ring-primary/5`
                                        : 'bg-white border-[hsl(var(--border))] text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/5'
                                }`}
                            >
                                <div className={`p-4 rounded-2xl transition-colors duration-150 ${
                                    isActive ? 'bg-white shadow-lg' : 'bg-muted/50 group-hover:bg-white'
                                }`}>
                                    <Icon className={`w-6 h-6 ${isActive ? config.activeText : 'text-muted-foreground'}`} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                    {config.label}
                                </span>
                                {isActive && (
                                    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${config.dot} animate-pulse shadow-[0_0_8px_currentColor]`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Section 2: Category Selection */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))] font-black text-xl shadow-sm">
                        2
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-[hsl(var(--foreground))]">Category Selection</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Select the budget category for these items.</p>
                    </div>
                </div>

                <div className="bg-white border border-[hsl(var(--border))] p-4 rounded-[2rem] shadow-sm">
                    <Select 
                        value={data.budgetCategory} 
                        onValueChange={(value) => onChange({ budgetCategory: value as any })}
                    >
                        <SelectTrigger className="w-full px-8 py-6 h-auto text-xs font-black uppercase tracking-[0.2em] bg-white border-none rounded-2xl text-[hsl(var(--foreground))] focus:ring-0 transition-colors duration-150">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-2xl">
                            {Object.values(IctBudgetCategory).map(cat => (
                                <SelectItem key={cat} value={cat} className="text-xs font-black uppercase tracking-widest text-muted-foreground focus:bg-[hsl(var(--primary))]/5 focus:text-[hsl(var(--primary))] py-4 cursor-pointer transition-colors">
                                    {cat.replace(/_/g, ' ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Section 3: Dynamic Items List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))] font-black text-xl shadow-sm">
                            3
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[hsl(var(--foreground))]">Requirements List</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Add items you wish to procure.</p>
                        </div>
                    </div>
                    <span className="px-4 py-2 bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/10 rounded-xl text-[10px] font-black tracking-widest text-[hsl(var(--primary))] shadow-sm">
                        {data.items.length} TOTAL ITEMS
                    </span>
                </div>

                <div className="bg-white border border-[hsl(var(--border))] p-8 rounded-[2.5rem] shadow-sm space-y-6">
                    <div className="space-y-4">
                        {data.items.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="w-12 h-14 bg-muted/30 border border-[hsl(var(--border))] rounded-2xl flex items-center justify-center text-[10px] font-black text-[hsl(var(--primary))] shrink-0 shadow-inner">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                                <div className="flex-grow">
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                                        className="w-full px-6 py-4 bg-white border-2 border-[hsl(var(--border))] rounded-2xl text-sm font-black text-[hsl(var(--foreground))] placeholder:text-muted-foreground/30 focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary))]/5 outline-none transition-colors duration-150 uppercase tracking-tight"
                                        placeholder="e.g. Laptop MacBook Pro M3..."
                                    />
                                </div>
                                {data.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="w-14 h-14 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 rounded-2xl transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out shrink-0 active:scale-90"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full py-5 border-2 border-dashed border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] text-muted-foreground hover:text-[hsl(var(--primary))] rounded-2xl flex items-center justify-center gap-3 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out font-black text-[10px] uppercase tracking-[0.2em] bg-muted/10 hover:bg-[hsl(var(--primary))]/5 active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" /> Add Another Item
                    </button>
                </div>
            </div>
        </div>
    );
};