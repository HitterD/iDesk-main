import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../../notifications/notification.service';
import { TelegramService } from '../../telegram/telegram.service';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { NotificationType, NotificationCategory } from '../../notifications/entities/notification.entity';
import { IctBudgetRequest, IctBudgetRealizationStatus } from '../entities/ict-budget-request.entity';
import { Ticket } from '../../ticketing/entities/ticket.entity';

@Injectable()
export class IctBudgetNotificationListener {
    private readonly logger = new Logger(IctBudgetNotificationListener.name);

    constructor(
        private readonly notificationService: NotificationService,
        private readonly telegramService: TelegramService,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    @OnEvent('ict-budget.created')
    async handleIctBudgetCreated(payload: { ictBudget: IctBudgetRequest, ticket: Ticket, user: User }) {
        const { ictBudget, ticket, user } = payload;
        this.logger.log(`Handling ict-budget.created for #${ticket.ticketNumber}`);

        // 1. Notify Managers & Admins (In-App)
        const admins = await this.userRepo.find({
            where: [
                { role: UserRole.ADMIN },
                { role: UserRole.MANAGER },
                { role: UserRole.AGENT },
            ]
        });

        for (const admin of admins) {
            await this.notificationService.create({
                userId: admin.id,
                type: NotificationType.ICT_BUDGET_CREATED,
                category: NotificationCategory.CATEGORY_HARDWARE,
                title: '🆕 Pengajuan Hardware Baru',
                message: `${user.fullName} mengajukan pengadaan ${ictBudget.budgetCategory}: ${ictBudget.items.map(i => i.name).join(', ')}`,
                ticketId: ticket.id,
                link: `/admin/hardware-requests/${ictBudget.id}`
            });
        }

        // 2. Notify Requester (In-App)
        await this.notificationService.create({
            userId: user.id,
            type: NotificationType.ICT_BUDGET_CREATED,
            category: NotificationCategory.CATEGORY_HARDWARE,
            title: '📝 Pengajuan Dibuat',
            message: `Pengajuan hardware #${ticket.ticketNumber} Anda telah berhasil dibuat dan menunggu persetujuan.`,
            ticketId: ticket.id,
            link: `/hardware-requests/${ictBudget.id}`
        });
    }

    @OnEvent('ict-budget.approved')
    async handleIctBudgetApproved(payload: { ictBudget: IctBudgetRequest, approved: boolean }) {
        const { ictBudget, approved } = payload;
        const requesterId = (ictBudget as any).ticket?.userId;
        if (!requesterId) return;

        this.logger.log(`Handling ict-budget.approved for budget ${ictBudget.id} (Status: ${approved})`);

        // Notify Requester
        await this.notificationService.create({
            userId: requesterId,
            type: approved ? NotificationType.ICT_BUDGET_APPROVED : NotificationType.ICT_BUDGET_REJECTED,
            category: NotificationCategory.CATEGORY_HARDWARE,
            title: approved ? '✅ Pengajuan Disetujui' : '❌ Pengajuan Ditolak',
            message: approved 
                ? `Pengajuan hardware Anda telah disetujui dan akan segera diproses oleh tim IT.`
                : `Pengajuan hardware Anda ditolak: ${ictBudget.superiorNotes || 'Tidak ada catatan.'}`,
            ticketId: ictBudget.ticketId,
            link: `/hardware-requests/${ictBudget.id}`
        });

        // Notify Agents if approved
        if (approved) {
            const agents = await this.userRepo.find({
                where: [{ role: UserRole.AGENT }, { role: UserRole.ADMIN }]
            });

            for (const agent of agents) {
                await this.notificationService.create({
                    userId: agent.id,
                    type: NotificationType.ICT_BUDGET_APPROVED,
                    category: NotificationCategory.CATEGORY_HARDWARE,
                    title: '🛠️ Siap Proses Pembelian',
                    message: `Pengajuan #${ictBudget.id.slice(0, 8)} telah disetujui. Silakan mulai proses pembelian.`,
                    ticketId: ictBudget.ticketId,
                    link: `/admin/hardware-requests/${ictBudget.id}`
                });
            }
        }
    }

    @OnEvent('ict-budget.arrived')
    async handleIctBudgetArrived(payload: { ictBudget: IctBudgetRequest, partial: boolean }) {
        const { ictBudget, partial } = payload;
        const requesterId = (ictBudget as any).ticket?.userId;
        if (!requesterId) return;

        this.logger.log(`Handling ict-budget.arrived for budget ${ictBudget.id} (Partial: ${partial})`);

        await this.notificationService.create({
            userId: requesterId,
            type: NotificationType.ICT_BUDGET_ARRIVED,
            category: NotificationCategory.CATEGORY_HARDWARE,
            title: partial ? '📦 Sebagian Barang Tiba' : '🎉 Barang Telah Tiba',
            message: partial 
                ? `Beberapa item dari pengajuan hardware Anda telah tiba di kantor.`
                : `Seluruh item dari pengajuan hardware Anda telah tiba. Silakan jadwalkan pemasangan jika diperlukan.`,
            ticketId: ictBudget.ticketId,
            link: `/hardware-requests/${ictBudget.id}`
        });
    }

    @OnEvent('ict-budget.realized')
    async handleIctBudgetRealized(payload: { ictBudget: IctBudgetRequest }) {
        const { ictBudget } = payload;
        const requesterId = (ictBudget as any).ticket?.userId;
        if (!requesterId) return;

        await this.notificationService.create({
            userId: requesterId,
            type: NotificationType.HARDWARE_INSTALL_COMPLETED,
            category: NotificationCategory.CATEGORY_HARDWARE,
            title: '🏁 Pengadaan Selesai',
            message: `Proses pengadaan hardware #${ictBudget.id.slice(0, 8)} telah selesai direalisasikan.`,
            ticketId: ictBudget.ticketId,
            link: `/hardware-requests/${ictBudget.id}`
        });
    }
}
