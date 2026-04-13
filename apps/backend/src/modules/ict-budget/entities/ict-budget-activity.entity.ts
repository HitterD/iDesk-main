import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IctBudgetRequest, IctBudgetRealizationStatus } from './ict-budget-request.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ict_budget_activities')
export class IctBudgetActivity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'ict_budget_id' })
    ictBudgetId: string;

    @ManyToOne(() => IctBudgetRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ict_budget_id' })
    ictBudget: IctBudgetRequest;

    @Column()
    action: string;

    @Column({ type: 'varchar', nullable: true })
    fromStatus: IctBudgetRealizationStatus | null;

    @Column({ type: 'varchar' })
    toStatus: IctBudgetRealizationStatus;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ name: 'performed_by_id' })
    performedById: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'performed_by_id' })
    performedBy: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
