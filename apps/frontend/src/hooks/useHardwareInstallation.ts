import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { 
  useIctBudgetInstallations, 
  useIctBudgetInstallationDetail,
  useIctBudgetStats 
} from '../features/request-center/api/ict-budget.api';
export interface HardwareInstallationFilters {
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    siteId?: string;
    page?: number;
    limit?: number;
}

/**
 * Hook to fetch specific hardware installation tickets using the dedicated endpoint
 */
export const useHardwareTickets = (filters?: HardwareInstallationFilters) => {
    // If limit/page are passed via filters, use them, otherwise use sensible defaults
    return useIctBudgetInstallations({
       ...filters,
       limit: filters?.limit || 10,
       page: filters?.page || 1
    });
};

export const useAllHardwareTickets = (filters?: HardwareInstallationFilters) => {
    // Return all data without page limits for the calendar
    return useIctBudgetInstallations({
       ...filters,
       page: 1,
       limit: 1000 
    });
};

/**
 * Hook to fetch hardware installation statistics using backend aggregation
 */
export const useHardwareStats = () => {
    return useIctBudgetStats();
};

export const useInstallationDetail = (ticketId: string) => {
    return useIctBudgetInstallationDetail(ticketId);
};