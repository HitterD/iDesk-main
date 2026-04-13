import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../../notifications/notification.service';
import { TelegramService } from '../../telegram/telegram.service';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { NotificationType, NotificationCategory } from '../../notifications/entities/notification.entity';
import { InstallationSchedule, ScheduleStatus } from '../entities/installation-schedule.entity';
import { format } from 'date-fns';

@Injectable()
export class InstallationNotificationListener {
    private readonly logger = new Logger(InstallationNotificationListener.name);

    constructor(
        private readonly notificationService: NotificationService,
        private readonly telegramService: TelegramService,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    @OnEvent('installation.requested')
    async handleInstallationRequested(payload: { schedule: InstallationSchedule }) {
        const { schedule } = payload;
        this.logger.log(`Handling installation.requested for schedule ${schedule.id}`);

        // 1. Notify Agents (In-App)
        const agents = await this.userRepo.find({
            where: [{ role: UserRole.AGENT }, { role: UserRole.ADMIN }]
        });

        const dateStr = format(new Date(schedule.scheduledDate), 'dd MMM yyyy');

        for (const agent of agents) {
            await this.notificationService.create({
                userId: agent.id,
                type: NotificationType.HARDWARE_INSTALL_REQUESTED,
                category: NotificationCategory.CATEGORY_HARDWARE,
                title: '🛠️ Permintaan Pemasangan Baru',
                message: `Permintaan pemasangan ${schedule.itemName} pada ${dateStr} (${schedule.scheduledTimeSlot}).`,
                ticketId: schedule.ticketId,
                link: `/admin/tickets/${schedule.ticketId}`
            });
        }
    }

    @OnEvent('installation.approved')
    async handleInstallationApproved(payload: { schedule: InstallationSchedule }) {
        const { schedule } = payload;
        this.logger.log(`Handling installation.approved for schedule ${schedule.id}`);

        const dateStr = format(new Date(schedule.scheduledDate), 'dd MMM yyyy');

        // Notify Requester
        if (schedule.requesterId) {
            await this.notificationService.create({
                userId: schedule.requesterId,
            type: NotificationType.HARDWARE_INSTALL_APPROVED,
            category: NotificationCategory.CATEGORY_HARDWARE,
            title: '✅ Jadwal Pemasangan Disetujui',
            message: `Jadwal pemasangan ${schedule.itemName} pada ${dateStr} (${schedule.scheduledTimeSlot}) telah dikonfirmasi oleh tim IT.`,
            ticketId: schedule.ticketId,
            link: `/hardware-requests/${schedule.ictBudgetRequestId}`
        });
        }
    }

    @OnEvent('installation.rescheduled')
    async handleInstallationRescheduled(payload: { schedule: InstallationSchedule }) {
        const { schedule } = payload;
        this.logger.log(`Handling installation.rescheduled for schedule ${schedule.id}`);

        const suggestedDateStr = schedule.suggestedDate ? format(new Date(schedule.suggestedDate), 'dd MMM yyyy') : 'N/A';

        // Notify Requester
        if (schedule.requesterId) {
            await this.notificationService.create({
                userId: schedule.requesterId,
            type: NotificationType.HARDWARE_INSTALL_RESCHEDULED,
            category: NotificationCategory.CATEGORY_HARDWARE,
            title: '📅 Jadwal Pemasangan Diatur Ulang',
            message: `Tim IT mengusulkan jadwal baru untuk ${schedule.itemName}: ${suggestedDateStr} (${schedule.suggestedTimeSlot}). Alasan: ${schedule.rescheduleReason}`,
            ticketId: schedule.ticketId,
            link: `/hardware-requests/${schedule.ictBudgetRequestId}`,
            requiresAcknowledge: true
        });
        }
    }

    @OnEvent('installation.completed')
    async handleInstallationCompleted(payload: { schedule: InstallationSchedule }) {
        const { schedule } = payload;
        this.logger.log(`Handling installation.completed for schedule ${schedule.id}`);

        // Notify Requester
        if (schedule.requesterId) {
            await this.notificationService.create({
                userId: schedule.requesterId,
            type: NotificationType.HARDWARE_INSTALL_COMPLETED,
            category: NotificationCategory.CATEGORY_HARDWARE,
            title: '✨ Pemasangan Selesai',
            message: `Pemasangan ${schedule.itemName} telah selesai dilaksanakan. Terima kasih!`,
            ticketId: schedule.ticketId,
            link: `/hardware-requests/${schedule.ictBudgetRequestId}`
        });
        }
    }
}
