import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsUUID, IsDateString, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IctBudgetRequestType, IctBudgetCategory, IctBudgetRealizationStatus } from '../entities/ict-budget-request.entity';

export class RequestedItemDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsBoolean()
    @IsOptional()
    isArrived?: boolean;
}

export class CreateIctBudgetDto {
    @IsEnum(IctBudgetRequestType)
    requestType: IctBudgetRequestType;

    @IsEnum(IctBudgetCategory)
    budgetCategory: IctBudgetCategory;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RequestedItemDto)
    items: RequestedItemDto[];

    @IsOptional()
    @IsString()
    vendor?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    renewalPeriodMonths?: number;

    @IsOptional()
    @IsDateString()
    currentExpiryDate?: string;

    @IsOptional()
    @IsBoolean()
    requiresInstallation?: boolean;

    // Ticket creation fields
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class ApproveIctBudgetDto {
    @IsBoolean()
    approved: boolean;

    @IsOptional()
    @IsString()
    superiorNotes?: string;
}

export class MarkArrivedDto {
    @IsArray()
    @IsString({ each: true })
    itemIds: string[];
}

export class RealizeIctBudgetDto {
    @IsOptional()
    @IsString()
    purchaseOrderNumber?: string;

    @IsOptional()
    @IsString()
    invoiceNumber?: string;

    @IsOptional()
    @IsString()
    realizationNotes?: string;
}

export class UpdateIctBudgetStatusDto {
    @IsString()
    @IsEnum(IctBudgetRealizationStatus)
    status: IctBudgetRealizationStatus;

    @IsOptional()
    @IsString()
    notes?: string;
}
