import { IctBudgetRealizationStatus } from '../entities/ict-budget-request.entity';

export class IctBudgetActivityResponseDto {
    id: string;
    ictBudgetId: string;
    action: string;
    fromStatus: IctBudgetRealizationStatus | null;
    toStatus: IctBudgetRealizationStatus;
    notes: string | null;
    performedById: string;
    createdAt: Date;
    performedBy?: {
        id: string;
        fullName: string;
        email: string;
    };
}
