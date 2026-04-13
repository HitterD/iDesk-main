import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export enum IctBudgetRequestType {
    PURCHASE = 'PURCHASE',
    RENEWAL = 'RENEWAL',
    LICENSE = 'LICENSE',
}

export enum IctBudgetCategory {
    HARDWARE = 'HARDWARE',
    LICENSE = 'LICENSE',
}

export enum IctBudgetRealizationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    PURCHASING = 'PURCHASING',
    PARTIALLY_ARRIVED = 'PARTIALLY_ARRIVED',
    ARRIVED = 'ARRIVED',
    REALIZED = 'REALIZED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export interface RequestedItem {
    id: string;
    name: string;
    isArrived: boolean;
    arrivedAt?: string;
    hasInstallationTicket?: boolean;
}

export interface IctBudgetRequest {
    id: string;
    ticketId?: string;
    requesterId: string;
    requester?: {
        id: string;
        fullName: string;
        email?: string;
    };
    ticket?: {
        id: string;
        userId: string;
        user?: {
            id: string;
            fullName: string;
            email?: string;
        };
    };
    requestType: IctBudgetRequestType;
    budgetCategory: IctBudgetCategory;
    items: RequestedItem[];
    vendor?: string;
    renewalPeriodMonths?: number;
    currentExpiryDate?: string;
    requiresInstallation?: boolean;
    departmentId?: string;
    siteId?: string;
    realizationStatus: IctBudgetRealizationStatus;
    approvedById?: string;
    approvedAt?: string;
    realizedById?: string;
    realizedAt?: string;
    rejectionReason?: string;
    attachmentUrl?: string;
    formUrl?: string;
    createdAt: string;
    updatedAt: string;
    title?: string;
    description?: string;
    installationSummary?: InstallationSummary | null;
}

export interface PaginatedIctBudgetResponse {
    data: IctBudgetRequest[];
    total: number;
    page: number;
    limit: number;
}

export interface InstallationTicket {
  id: string;
  ticketNumber: string | null;
  title: string;
  status: string;
  hardwareType: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  scheduledTimeSlot: string | null;
  site: { id: string; name: string } | null;
  requester: { id: string; fullName: string } | null;
  assignedTo: { id: string; fullName: string } | null;
  ictBudgetRequestId: string | null;
  itemName: string | null;
  itemIndex: number | null;
  createdAt: string;
}

export interface PaginatedInstallationsResponse {
  data: InstallationTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RequestInstallationsResponse {
  data: InstallationTicket[];
  total: number;
  installed: number;
  inProgress: number;
  scheduled: number;
}

export interface InstallationSummary {
  total: number;
  installed: number;
  inProgress: number;
  scheduled: number;
  nextScheduledDate: string | null;
}

// Fetch all ICT Budget requests
export const useIctBudgetRequests = (filters?: { status?: IctBudgetRealizationStatus; requesterId?: string; page?: number; limit?: number; search?: string }) => {
    return useQuery<PaginatedIctBudgetResponse>({
        queryKey: ['ict-budget-requests', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.status) params.append('status', filters.status);
            if (filters?.requesterId) params.append('requesterId', filters.requesterId);
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.search) params.append('search', filters.search);
            
            const res = await api.get(`/ict-budget?${params.toString()}`);
            return res.data;
        },
    });
};

// Fetch summary counts for status tabs
export const useIctBudgetSummaryCounts = () => {
    return useQuery<Record<string, number>>({
        queryKey: ['ict-budget-summary-counts'],
        queryFn: async () => {
            const res = await api.get('/ict-budget/summary-counts');
            return res.data;
        },
    });
};

// Fetch hardware installation stats
export const useIctBudgetStats = () => {
    return useQuery<{
        total: number;
        todo: number;
        inProgress: number;
        resolved: number;
        cancelled: number;
    }>({
        queryKey: ['ict-budget-stats'],
        queryFn: async () => {
            const res = await api.get('/ict-budget/installations/stats');
            return res.data;
        },
    });
};

// Fetch ICT Budget detail
export const useIctBudgetDetail = (id: string) => {
    return useQuery<IctBudgetRequest>({
        queryKey: ['ict-budget-request', id],
        queryFn: async () => {
            const res = await api.get(`/ict-budget/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
};

export interface CreateIctBudgetPayload {
    requestType: IctBudgetRequestType;
    budgetCategory: IctBudgetCategory;
    items: { id?: string; name: string }[];
    vendor?: string;
    requiresInstallation?: boolean;
    title?: string;
    description?: string;
    renewalPeriodMonths?: number;
    currentExpiryDate?: string;
}

// Create ICT Budget request
export const useCreateIctBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateIctBudgetPayload) => {
            const res = await api.post('/ict-budget', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-requests'] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
};

// Approve ICT Budget request
export const useApproveIctBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, approved, superiorNotes }: { id: string; approved: boolean; superiorNotes?: string }) => {
            const res = await api.patch(`/ict-budget/${id}/approve`, { approved, superiorNotes });
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-requests'] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-request', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-activities', variables.id] });
        },
    });
};

// Cancel ICT Budget request
export const useCancelIctBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/ict-budget/${id}/cancel`);
            return res.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-requests'] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-request', id] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-activities', id] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
};

// Start Purchasing process
export const useStartPurchasing = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/ict-budget/${id}/purchasing`);
            return res.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-requests'] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-request', id] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-activities', id] });
        },
    });
};

// Mark Arrived process
export const useMarkArrived = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, itemIds }: { id: string; itemIds: string[] }) => {
            const res = await api.patch(`/ict-budget/${id}/arrived`, { itemIds });
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-requests'] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-request', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-activities', variables.id] });
        },
    });
};

// Request installation for a specific item
export const useRequestItemInstallation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, itemId, date, timeSlot }: { id: string; itemId: string; date: string; timeSlot: string }) => {
            const res = await api.patch(`/ict-budget/${id}/item/${itemId}/install`, { date, timeSlot });
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-request', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-schedules', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['monthly-availability'] });
        },
    });
};

// Approve installation schedule
export const useApproveInstallation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ budgetId, scheduleId }: { budgetId: string; scheduleId: string }) => {
            const res = await api.patch(`/installation-schedule/${scheduleId}/approve`);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-schedules', variables.budgetId] });
        },
    });
};

// Reschedule installation
export const useRescheduleInstallation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ budgetId, scheduleId, date, timeSlot, reason }: { budgetId: string; scheduleId: string; date: string; timeSlot: string; reason: string }) => {
            const res = await api.patch(`/installation-schedule/${scheduleId}/reschedule`, { date, timeSlot, reason });
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-schedules', variables.budgetId] });
            queryClient.invalidateQueries({ queryKey: ['monthly-availability'] });
        },
    });
};

// Complete installation
export const useCompleteInstallation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ budgetId, scheduleId, notes }: { budgetId: string; scheduleId: string; notes?: string }) => {
            const res = await api.patch(`/installation-schedule/${scheduleId}/complete`, { notes });
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-schedules', variables.budgetId] });
        },
    });
};

// Fetch monthly availability for installation schedules
export const useMonthlyAvailability = (year: number, month: number) => {
    return useQuery<{ date: string; available: boolean; slots: { time: string; available: boolean; capacity: number; booked: number }[] }[]>({
        queryKey: ['monthly-availability', year, month],
        queryFn: async () => {
            const res = await api.get(`/installation-schedule/monthly-availability?year=${year}&month=${month}`);
            return res.data;
        },
        enabled: !!year && !!month,
    });
};

// Fetch schedules for a specific ICT budget request
export const useIctBudgetSchedules = (id: string) => {
    return useQuery<any[]>({
        queryKey: ['ict-budget-schedules', id],
        queryFn: async () => {
            const res = await api.get(`/installation-schedule/budget/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
};

// Realize ICT Budget request
export const useRealizeIctBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string; purchaseOrderNumber: string; invoiceNumber: string; realizationNotes: string }) => {
            const res = await api.patch(`/ict-budget/${id}/realize`, dto);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-requests'] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-request', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-activities', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
};

// Update ICT Budget status (legacy / general)
export const useUpdateIctBudgetStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, actualCost, notes }: { id: string; status: IctBudgetRealizationStatus; actualCost?: number; notes?: string }) => {
            const res = await api.patch(`/ict-budget/${id}/status`, { status, actualCost, notes });
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ict-budget-requests'] });
            queryClient.invalidateQueries({ queryKey: ['ict-budget-request', variables.id] });
        },
    });
};

export function useIctBudgetInstallations(params: {
  page?: number;
  limit?: number;
  status?: string;
  siteId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery<PaginatedInstallationsResponse>({
    queryKey: ['ict-budget-installations', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.status) searchParams.set('status', params.status);
      if (params.siteId) searchParams.set('siteId', params.siteId);
      if (params.search) searchParams.set('search', params.search);
      if (params.startDate) searchParams.set('startDate', params.startDate);
      if (params.endDate) searchParams.set('endDate', params.endDate);
      const res = await api.get(`/ict-budget/installations?${searchParams}`);
      return res.data;
    },
  });
}

export function useIctBudgetRequestInstallations(id: string) {
  return useQuery<RequestInstallationsResponse>({
    queryKey: ['ict-budget-request-installations', id],
    queryFn: async () => {
      const res = await api.get(`/ict-budget/${id}/installations`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useIctBudgetInstallationDetail(ticketId: string) {
    return useQuery<any>({
        queryKey: ['ict-budget-installation-detail', ticketId],
        queryFn: async () => {
            const res = await api.get(`/ict-budget/installations/${ticketId}`);
            return res.data;
        },
        enabled: !!ticketId,
    });
}

