import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Ticket } from '../../ticketing/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';

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
    REJECTED = 'REJECTED',
    PURCHASING = 'PURCHASING',
    PARTIALLY_ARRIVED = 'PARTIALLY_ARRIVED',
    ARRIVED = 'ARRIVED',
    REALIZED = 'REALIZED',
    CANCELLED = 'CANCELLED',
}

export interface RequestedItem {
    id: string; // uuid for tracking individual items
    name: string;
    isArrived: boolean;
    arrivedAt?: Date;
    hasInstallationTicket?: boolean;
}

@Entity('ict_budget_requests')
export class IctBudgetRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    ticketId: string;

    @ManyToOne(() => Ticket)
    @JoinColumn({ name: 'ticketId' })
    ticket: Ticket;

    // Request Type
    @Column({
        type: 'enum',
        enum: IctBudgetRequestType,
        default: IctBudgetRequestType.PURCHASE,
    })
    requestType: IctBudgetRequestType;

    @Column({
        type: 'enum',
        enum: IctBudgetCategory,
        default: IctBudgetCategory.HARDWARE,
    })
    budgetCategory: IctBudgetCategory;

    // Dynamic items array
    @Column('jsonb', { default: [] })
    items: RequestedItem[];

    @Column({ type: 'varchar', nullable: true })
    vendor: string;

    @Column({ nullable: true })
    renewalPeriodMonths: number; // For renewal: how many months

    @Column({ nullable: true, type: 'date' })
    currentExpiryDate: Date | null; // For renewal: current expiry date

    // Approval workflow
    @Column({ type: 'varchar', nullable: true })
    superiorId: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'superiorId' })
    superior: User;

    @Column({ type: 'timestamp', nullable: true })
    superiorApprovedAt: Date | null;

    @Column({ nullable: true, type: 'text' })
    superiorNotes: string | null;

    // Realization
    @Column({
        type: 'enum',
        enum: IctBudgetRealizationStatus,
        default: IctBudgetRealizationStatus.PENDING,
    })
    realizationStatus: IctBudgetRealizationStatus;

    @Column({ type: 'varchar', nullable: true })
    realizedById: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'realizedById' })
    realizedBy: User | null;

    @Column({ type: 'timestamp', nullable: true })
    realizedAt: Date | null;

    @Column({ nullable: true, type: 'text' })
    realizationNotes: string | null;

    @Column({ type: 'varchar', nullable: true })
    purchaseOrderNumber: string | null;

    @Column({ type: 'varchar', nullable: true })
    invoiceNumber: string | null;

    // Hardware installation link
    @Column({ default: false })
    requiresInstallation: boolean;

    @Column({ type: 'varchar', nullable: true })
    linkedHwTicketId: string;

    @ManyToOne(() => Ticket, { nullable: true })
    @JoinColumn({ name: 'linkedHwTicketId' })
    linkedHwTicket: Ticket;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
