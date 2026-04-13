import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Plus, 
    Search, 
    HardDrive, 
    Clock, 
    CheckCircle2, 
    ChevronRight,
    Package,
    ShoppingCart,
    Loader2,
    LayoutGrid,
    List,
    ChevronDown,
    ChevronUp,
    Wrench,
} from 'lucide-react';
import { 
    useIctBudgetRequests, 
    useCancelIctBudget, 
    IctBudgetRealizationStatus,
    useIctBudgetSummaryCounts 
} from '../api/ict-budget.api';
import { InstallationTab } from '../components/InstallationTab';
import { HardwareRequestCardItem } from '../components/HardwareRequestCardItem';
import { HardwareRequestListItem } from '../components/HardwareRequestListItem';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/stores/useAuth';
import { toast } from 'sonner';
import { HardwareRequestSkeleton } from '../components/HardwareRequestSkeleton';
const TABS = [
  { label: 'All', value: 'ALL', icon: HardDrive, color: 'default' },
  { label: 'Pending', value: 'PENDING', icon: Clock, color: 'amber' },
  { label: 'Purchasing', value: 'PURCHASING', icon: ShoppingCart, color: 'indigo' },
  { label: 'Arrived', value: 'ARRIVED', icon: Package, color: 'blue' },
  { label: 'Completed', value: 'REALIZED', icon: CheckCircle2, color: 'success' },
  { label: 'Installation', value: 'INSTALLATION', icon: Wrench, color: 'purple' },
];


export const HardwareRequestPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const cancelMutation = useCancelIctBudget();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [page, setPage] = useState(1);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const isInstallationTab = statusFilter === 'INSTALLATION';
    const { data: response, isLoading } = useIctBudgetRequests({
        page,
        limit: 10,
        status: statusFilter === 'ALL' || isInstallationTab ? undefined : statusFilter as IctBudgetRealizationStatus,
        search: debouncedSearchTerm
    });

    const { data: summaryCounts } = useIctBudgetSummaryCounts();

    const requests = response?.data || [];
    const totalPages = Math.ceil((response?.total || 0) / (response?.limit || 10));

    // Reset page to 1 when filters change
    React.useEffect(() => {
        setPage(1);
    }, [statusFilter, debouncedSearchTerm]);

    const handleCreateNew = () => {
        const basePath = location.pathname.startsWith('/client') ? '/client' : location.pathname.startsWith('/manager') ? '/manager' : '';
        navigate(`${basePath}/hardware-requests/new`);
    };

    const handleViewDetail = (id: string) => {
        const basePath = location.pathname.startsWith('/client') ? '/client' : location.pathname.startsWith('/manager') ? '/manager' : '';
        navigate(`${basePath}/hardware-requests/${id}`);
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleCancel = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to cancel this request?')) {
            try {
                await cancelMutation.mutateAsync(id);
                toast.success('Request cancelled successfully');
            } catch(error) {
                toast.error('Failed to cancel request');
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] text-[10px] font-extrabold uppercase tracking-widest mb-1 shadow-sm">
                        <Package className="w-3 h-3" />
                        Logistics & Procurement
                    </div>
                    <h1 className="text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tighter flex items-center gap-4 uppercase">
                        Hardware Requests
                    </h1>
                    <p className="text-muted-foreground text-xs font-medium opacity-70">Manage procurement, ICT budget, and installation scheduling.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center justify-center gap-3 px-6 py-3 bg-[hsl(var(--primary))] text-primary-foreground font-extrabold rounded-xl hover:brightness-110 hover:shadow-xl hover:shadow-primary/20 transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out text-[10px] uppercase tracking-widest active:scale-95 group shadow-lg"
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    New Request
                </button>
            </div>

            {/* Interactive Tab Bar */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-1.5 shadow-sm">
                <div className="flex flex-wrap gap-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = statusFilter === tab.value;
                        const count = summaryCounts ? summaryCounts[tab.value] || 0 : 0;

                        return (
                            <button
                                key={tab.value}
                                onClick={() => { setStatusFilter(tab.value); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-[opacity,transform,colors] duration-200 ease-out ${
                                    isActive 
                                        ? 'bg-[hsl(var(--primary))] text-white shadow-md' 
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                                {tab.label}
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-muted-foreground/10 text-muted-foreground'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filters, Search & View Toggle */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search requests by title or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl text-sm font-medium text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 outline-none transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out placeholder:opacity-50 shadow-sm"
                    />
                </div>
                <div className="flex bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-1 shadow-sm">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-lg transition-colors duration-150 ${viewMode === 'list' ? 'bg-[hsl(var(--primary))] text-white shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`p-2.5 rounded-lg transition-[transform,box-shadow,border-color,opacity,background-color] duration-200 ease-out ${viewMode === 'card' ? 'bg-[hsl(var(--primary))] text-white shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {isInstallationTab ? (
                    <InstallationTab />
                ) : isLoading ? (
                    <HardwareRequestSkeleton viewMode={viewMode} />
                ) : requests.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl shadow-inner">
                        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6 text-muted-foreground/30 border border-border/50 group hover:scale-110 transition-transform duration-500">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-extrabold text-[hsl(var(--foreground))] mb-2 uppercase tracking-tight">No Results Found</h3>
                        <p className="text-[10px] font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed opacity-60 uppercase tracking-widest px-8">Try adjusting your search keywords or filters.</p>
                    </div>
                ) : viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {requests.map(req => (
                            <HardwareRequestCardItem 
                                key={req.id} 
                                req={req as any} 
                                onClick={handleViewDetail} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[hsl(var(--border))] text-xs font-semibold text-muted-foreground tracking-wider">
                            <div className="col-span-1">ID</div>
                            <div className="col-span-4">Title / Items</div>
                            <div className="col-span-2">Requester</div>
                            <div className="col-span-2 text-center">Status</div>
                            <div className="col-span-2">Progress</div>
                            <div className="col-span-1 text-right pr-2">Date</div>
                        </div>

                        {/* Table Rows */}
                        {requests.map(req => (
                            <HardwareRequestListItem 
                                key={req.id} 
                                req={req as any} 
                                isExpanded={!!expandedRows[req.id]} 
                                onToggleExpand={toggleExpand} 
                                onClick={handleViewDetail} 
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 border border-border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 border border-border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};