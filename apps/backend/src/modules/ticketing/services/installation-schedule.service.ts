import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InstallationSchedule, ScheduleStatus } from '../entities/installation-schedule.entity';
import { IctBudgetRequest, IctBudgetRealizationStatus } from '../../ict-budget/entities/ict-budget-request.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

@Injectable()
export class InstallationScheduleService {
    private readonly SLOTS = ['08:00-12:00', '13:00-17:00'];
    private readonly MAX_PER_SLOT = 2;

    constructor(
        @InjectRepository(InstallationSchedule)
        private readonly scheduleRepo: Repository<InstallationSchedule>,
        @InjectRepository(IctBudgetRequest)
        private readonly ictBudgetRepo: Repository<IctBudgetRequest>,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async getAvailableSlots(dateString: string) {
        const queryDate = new Date(dateString);
        if (isNaN(queryDate.getTime())) {
            throw new BadRequestException('Invalid date format');
        }

        // Use raw query or direct string comparison since column is 'date' type
        const schedules = await this.scheduleRepo.createQueryBuilder('schedule')
            .where('schedule.scheduledDate = :date', { date: dateString })
            .getMany();

        // Count non-cancelled bookings
        const slotCounts: Record<string, number> = {
            '08:00-12:00': 0,
            '13:00-17:00': 0,
        };

        for (const schedule of schedules) {
            if (schedule.status !== ScheduleStatus.CANCELLED && this.SLOTS.includes(schedule.scheduledTimeSlot)) {
                slotCounts[schedule.scheduledTimeSlot]++;
            }
        }

        const slots = this.SLOTS.map(time => ({
            time,
            available: slotCounts[time] < this.MAX_PER_SLOT,
            capacity: this.MAX_PER_SLOT,
            booked: slotCounts[time]
        }));

        return {
            date: dateString,
            slots
        };
    }

    async getMonthlyAvailability(year: number, month: number) {
        // Start and end of month in local time
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        // Fetch all schedules for the month using local date range
        // Since column is 'date' type, Between(startDate, endDate) might work but let's be explicit
        const schedules = await this.scheduleRepo.createQueryBuilder('schedule')
            .where('schedule.scheduledDate >= :start AND schedule.scheduledDate <= :end', {
                start: formatLocalDate(startDate),
                end: formatLocalDate(endDate),
            })
            .getMany();

        const dailyCounts: Record<string, Record<string, number>> = {};

        // Initialize daily counts for the whole month
        const d = new Date(startDate);
        while (d <= endDate) {
            const dateStr = formatLocalDate(d);
            dailyCounts[dateStr] = {
                '08:00-12:00': 0,
                '13:00-17:00': 0,
            };
            d.setDate(d.getDate() + 1);
        }

        // Aggregate bookings
        for (const schedule of schedules) {
            if (schedule.status !== ScheduleStatus.CANCELLED && this.SLOTS.includes(schedule.scheduledTimeSlot)) {
                // Postgres 'date' type might be returned as string or Date object
                const dateStr = typeof schedule.scheduledDate === 'string' 
                    ? (schedule.scheduledDate as string).split('T')[0]
                    : formatLocalDate(new Date(schedule.scheduledDate));
                
                if (dailyCounts[dateStr]) {
                    dailyCounts[dateStr][schedule.scheduledTimeSlot]++;
                }
            }
        }

        const result = Object.keys(dailyCounts).map(dateStr => {
            const slots = this.SLOTS.map(time => ({
                time,
                available: dailyCounts[dateStr][time] < this.MAX_PER_SLOT,
                capacity: this.MAX_PER_SLOT,
                booked: dailyCounts[dateStr][time]
            }));

            return {
                date: dateStr,
                available: slots.some(s => s.available), // Day is available if at least one slot is available
                slots
            };
        });

        return result;
    }

    async createSchedule(data: {
        ictBudgetRequestId?: string;
        ticketId?: string;
        requesterId: string;
        scheduledDate: string;
        scheduledTimeSlot: string;
        itemName?: string;
        itemIndex?: number;
    }) {
        if (!this.SLOTS.includes(data.scheduledTimeSlot)) {
            throw new BadRequestException('Invalid time slot');
        }

        if (data.ictBudgetRequestId) {
            const ictBudget = await this.ictBudgetRepo.findOne({ where: { id: data.ictBudgetRequestId } });
            if (!ictBudget) {
                throw new NotFoundException('ICT Budget request not found');
            }
            if (ictBudget.realizationStatus !== IctBudgetRealizationStatus.ARRIVED && ictBudget.realizationStatus !== IctBudgetRealizationStatus.PARTIALLY_ARRIVED) {
                throw new BadRequestException('Cannot schedule installation unless the items have arrived (status ARRIVED or PARTIALLY_ARRIVED)');
            }
        }

        const availability = await this.getAvailableSlots(data.scheduledDate);
        const slotInfo = availability.slots.find(s => s.time === data.scheduledTimeSlot);

        if (!slotInfo || !slotInfo.available) {
            throw new BadRequestException('Time slot is full or unavailable');
        }

        const schedule = this.scheduleRepo.create({
            ictBudgetRequestId: data.ictBudgetRequestId,
            ticketId: data.ticketId,
            itemName: data.itemName,
            itemIndex: data.itemIndex,
            requesterId: data.requesterId,
            scheduledDate: data.scheduledDate as any, // Use string directly for 'date' column
            scheduledTimeSlot: data.scheduledTimeSlot,
            status: ScheduleStatus.PENDING,
        });

        const saved = await this.scheduleRepo.save(schedule);
        this.eventEmitter.emit('installation.requested', { schedule: saved });
        return saved;
    }

    async getSchedulesByBudgetRequest(ictBudgetRequestId: string) {
        return this.scheduleRepo.find({
            where: { ictBudgetRequestId },
            order: { createdAt: 'DESC' },
            relations: ['requester', 'processedBy']
        });
    }
    
    async getAllSchedules() {
        return this.scheduleRepo.find({
            order: { scheduledDate: 'DESC' },
            relations: ['requester', 'processedBy']
        });
    }

    async approveSchedule(id: string, agentId: string) {
        const schedule = await this.scheduleRepo.findOne({ where: { id }, relations: ['requester'] });
        if (!schedule) throw new NotFoundException('Schedule not found');

        schedule.status = ScheduleStatus.APPROVED;
        schedule.processedById = agentId;
        schedule.processedAt = new Date();

        const saved = await this.scheduleRepo.save(schedule);
        this.eventEmitter.emit('installation.approved', { schedule: saved });
        return saved;
    }

    async completeSchedule(id: string, agentId: string, notes?: string) {
        const schedule = await this.scheduleRepo.findOne({ where: { id }, relations: ['requester'] });
        if (!schedule) throw new NotFoundException('Schedule not found');

        schedule.status = ScheduleStatus.COMPLETED;
        schedule.processedById = agentId;
        schedule.processedAt = new Date();
        if (notes) schedule.notes = notes;

        const saved = await this.scheduleRepo.save(schedule);
        this.eventEmitter.emit('installation.completed', { schedule: saved });
        return saved;
    }

    async reschedule(id: string, agentId: string, date: string, timeSlot: string, reason: string) {
        const schedule = await this.scheduleRepo.findOne({ where: { id }, relations: ['requester'] });
        if (!schedule) throw new NotFoundException('Schedule not found');

        schedule.status = ScheduleStatus.RESCHEDULED;
        schedule.processedById = agentId;
        schedule.processedAt = new Date();
        schedule.rescheduleReason = reason;
        schedule.suggestedDate = new Date(date);
        schedule.suggestedTimeSlot = timeSlot;

        const saved = await this.scheduleRepo.save(schedule);
        this.eventEmitter.emit('installation.rescheduled', { schedule: saved });
        return saved;
    }
}
