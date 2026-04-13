import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ScheduleStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    RESCHEDULED = 'RESCHEDULED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

@Entity('installation_schedules')
export class InstallationSchedule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', nullable: true })
    ticketId: string;

    @Column({ type: 'varchar', nullable: true })
    ictBudgetRequestId: string;

    @Column({ type: 'varchar', nullable: true })
    itemName: string;

    @Column({ type: 'int', nullable: true })
    itemIndex: number;

    @Column({ type: 'varchar', nullable: true })
    requesterId: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'requesterId' })
    requester: User | null;

    @Column({ type: 'date' })
    scheduledDate: Date;

    @Column()
    scheduledTimeSlot: string; // e.g. "08:00-12:00" or "13:00-17:00"

    @Column({
        type: 'enum',
        enum: ScheduleStatus,
        default: ScheduleStatus.PENDING,
    })
    status: ScheduleStatus;

    @Column({ type: 'varchar', nullable: true })
    processedById: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'processedById' })
    processedBy: User;

    @Column({ type: 'timestamp', nullable: true })
    processedAt: Date;

    @Column({ nullable: true, type: 'text' })
    rescheduleReason: string;

    @Column({ nullable: true, type: 'date' })
    suggestedDate: Date;

    @Column({ type: 'varchar', nullable: true })
    suggestedTimeSlot: string;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
