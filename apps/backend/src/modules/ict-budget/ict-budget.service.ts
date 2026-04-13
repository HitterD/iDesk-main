import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IctBudgetRequest, IctBudgetRealizationStatus, IctBudgetRequestType, RequestedItem } from './entities/ict-budget-request.entity';
import { IctBudgetActivity } from './entities/ict-budget-activity.entity';
import { Ticket, TicketType, TicketStatus } from '../ticketing/entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { InstallationSchedule, ScheduleStatus } from '../ticketing/entities/installation-schedule.entity';
import { CreateIctBudgetDto, ApproveIctBudgetDto, RealizeIctBudgetDto, MarkArrivedDto } from './dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class IctBudgetService {
    private readonly SLOTS = ['08:00-12:00', '13:00-17:00'];
    private readonly MAX_PER_SLOT = 2;

    constructor(
        private readonly auditService: AuditService,
        @InjectRepository(IctBudgetRequest)
        private readonly ictBudgetRepo: Repository<IctBudgetRequest>,
        @InjectRepository(Ticket)
        private readonly ticketRepo: Repository<Ticket>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(IctBudgetActivity)
        private readonly activityRepo: Repository<IctBudgetActivity>,
        @InjectRepository(InstallationSchedule)
        private readonly scheduleRepo: Repository<InstallationSchedule>,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async create(userId: string, dto: CreateIctBudgetDto): Promise<IctBudgetRequest> {
        // Get user with site info
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['department'],
        });
        if (!user) throw new NotFoundException('User not found');

        // Extract item names for description
        const itemNamesList = dto.items.map(i => i.name).join(', ');

        // Create ticket first
        const ticket = this.ticketRepo.create({
            title: dto.title || `ICT Budget: ${itemNamesList.slice(0, 50)}${itemNamesList.length > 50 ? '...' : ''}`,
            description: dto.description || `Pengajuan pengadaan untuk: \n- ${dto.items.map(i => i.name).join('\n- ')}`,
            ticketType: TicketType.ICT_BUDGET,
            status: TicketStatus.TODO,
            priority: 'MEDIUM',
            category: 'ICT_BUDGET',
            userId: userId,
            siteId: user.siteId,
        } as Partial<Ticket>);

        const savedTicket = await this.ticketRepo.save(ticket);

        // Map items and ensure IDs exist
        const formattedItems: RequestedItem[] = dto.items.map(item => ({
            id: item.id || uuidv4(),
            name: item.name,
            isArrived: false,
        }));

        // Create ICT Budget request
        const ictBudget = this.ictBudgetRepo.create({
            ticketId: savedTicket.id,
            requestType: dto.requestType,
            budgetCategory: dto.budgetCategory,
            items: formattedItems,
            vendor: dto.vendor,
            renewalPeriodMonths: dto.renewalPeriodMonths,
            currentExpiryDate: dto.currentExpiryDate ? new Date(dto.currentExpiryDate) : null,
            requiresInstallation: dto.requiresInstallation || false,
            realizationStatus: IctBudgetRealizationStatus.PENDING,
        } as Partial<IctBudgetRequest>);

        const saved = await this.ictBudgetRepo.save(ictBudget);

        await this.logActivity(
            saved.id,
            'CREATED',
            null,
            IctBudgetRealizationStatus.PENDING,
            userId,
        );

        // Emit event for notification
        this.eventEmitter.emit('ict-budget.created', { ictBudget: saved, ticket: savedTicket, user });

        return saved;
    }

    async findAll(user: { userId: string; role: string; siteId?: string }, options: { siteId?: string; status?: string; page?: number; limit?: number; search?: string } = {}): Promise<{ data: IctBudgetRequest[], total: number, page: number, limit: number }> {
        const qb = this.ictBudgetRepo.createQueryBuilder('ict')
            .leftJoinAndSelect('ict.ticket', 'ticket')
            .leftJoinAndSelect('ticket.user', 'user')
            .leftJoinAndSelect('ict.superior', 'superior')
            .leftJoinAndSelect('ict.realizedBy', 'realizedBy');

        if (user.role === 'USER') {
            qb.andWhere('ticket.userId = :userId', { userId: user.userId });
        } else if (user.role !== 'ADMIN') {
            const targetSiteId = options.siteId || user.siteId;
            if (targetSiteId) {
                qb.andWhere('ticket.siteId = :siteId', { siteId: targetSiteId });
            }
        } else if (options.siteId) {
            qb.andWhere('ticket.siteId = :siteId', { siteId: options.siteId });
        }

        if (options.status) {
            qb.andWhere('ict.realizationStatus = :status', { status: options.status });
        }

        if (options.search) {
            qb.andWhere(
                '(ticket.title ILIKE :search OR ticket.ticketNumber ILIKE :search OR ict."budgetCategory"::text ILIKE :search)',
                { search: `%${options.search}%` }
            );
        }

        qb.orderBy('ict.createdAt', 'DESC');

        const page = options.page || 1;
        const limit = options.limit || 10;
        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return { data, total, page, limit };
    }

    async getInstallationStats(user: { userId: string; role: string; siteId?: string }) {
        const qb = this.ticketRepo.createQueryBuilder('ticket')
            .select("ticket.status", "status")
            .addSelect("COUNT(*)", "count")
            .where('ticket.ticketType = :type', { type: 'HARDWARE_INSTALLATION' })
            .andWhere('ticket.isHardwareInstallation = :isHw', { isHw: true });

        if (user.role === 'USER') {
            qb.andWhere('ticket.userId = :userId', { userId: user.userId });
        } else if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.siteId) {
            qb.andWhere('ticket.siteId = :siteId', { siteId: user.siteId });
        }

        qb.groupBy("ticket.status");
        const rawStats = await qb.getRawMany();

        const stats = {
            total: 0,
            todo: 0,
            inProgress: 0,
            resolved: 0,
            cancelled: 0
        };

        rawStats.forEach(s => {
            const count = parseInt(s.count, 10);
            stats.total += count;
            if (s.status === 'TODO') stats.todo = count;
            else if (s.status === 'IN_PROGRESS') stats.inProgress = count;
            else if (s.status === 'RESOLVED') stats.resolved = count;
            else if (s.status === 'CANCELLED') stats.cancelled = count;
        });

        return stats;
    }

    async getSummaryCounts(user: { userId: string; role: string; siteId?: string }) {
        const qb = this.ictBudgetRepo.createQueryBuilder('ict')
            .leftJoin('ict.ticket', 'ticket')
            .select("ict.realizationStatus", "status")
            .addSelect("COUNT(*)", "count");

        if (user.role === 'USER') {
            qb.andWhere('ticket.userId = :userId', { userId: user.userId });
        } else if (user.role !== 'ADMIN' && user.siteId) {
            qb.andWhere('ticket.siteId = :siteId', { siteId: user.siteId });
        }

        qb.groupBy("ict.realizationStatus");
        const rawCounts = await qb.getRawMany();

        const counts: Record<string, number> = {
            ALL: 0,
            PENDING: 0,
            PURCHASING: 0,
            ARRIVED: 0,
            REALIZED: 0,
            INSTALLATION: 0
        };

        rawCounts.forEach(c => {
            const count = parseInt(c.count, 10);
            counts.ALL += count;
            if (counts.hasOwnProperty(c.status)) {
                counts[c.status] = count;
            }
        });

        // Get installation count separately
        const instStats = await this.getInstallationStats(user);
        counts.INSTALLATION = instStats.total;

        return counts;
    }

    async findOne(id: string): Promise<IctBudgetRequest> {
        const ictBudget = await this.ictBudgetRepo.findOne({
            where: { id },
            relations: ['ticket', 'ticket.user', 'superior', 'realizedBy', 'linkedHwTicket'],
        });
        if (!ictBudget) {
            throw new NotFoundException('ICT Budget request not found');
        }
        return ictBudget;
    }

    async findByTicketId(ticketId: string): Promise<IctBudgetRequest | null> {
        return this.ictBudgetRepo.findOne({
            where: { ticketId },
            relations: ['ticket', 'superior', 'realizedBy'],
        });
    }

    async approve(id: string, superiorId: string, dto: ApproveIctBudgetDto): Promise<IctBudgetRequest> {
        const ictBudget = await this.findOne(id);

        if (ictBudget.realizationStatus !== IctBudgetRealizationStatus.PENDING) {
            throw new BadRequestException('Can only approve pending requests');
        }

        const fromStatus = ictBudget.realizationStatus;
        const toStatus = dto.approved
            ? IctBudgetRealizationStatus.APPROVED
            : IctBudgetRealizationStatus.REJECTED;

        ictBudget.superiorId = superiorId;
        ictBudget.superiorApprovedAt = new Date();
        ictBudget.superiorNotes = dto.superiorNotes || null;
        ictBudget.realizationStatus = toStatus;

        const saved = await this.ictBudgetRepo.save(ictBudget);

        await this.logActivity(
            saved.id,
            dto.approved ? 'APPROVED' : 'REJECTED',
            fromStatus,
            toStatus,
            superiorId,
            dto.superiorNotes,
        );

        // Update ticket status
        if (dto.approved) {
            await this.ticketRepo.update(ictBudget.ticketId, { status: TicketStatus.IN_PROGRESS });
        } else {
            await this.ticketRepo.update(ictBudget.ticketId, { status: TicketStatus.CANCELLED });
        }

        // Emit event
        this.eventEmitter.emit('ict-budget.approved', { ictBudget: saved, approved: dto.approved });

        return saved;
    }

    async startPurchasing(id: string, agentId: string): Promise<IctBudgetRequest> {
        const ictBudget = await this.findOne(id);

        if (ictBudget.realizationStatus !== IctBudgetRealizationStatus.APPROVED) {
            throw new BadRequestException('Can only start purchasing approved requests');
        }

        const fromStatus = ictBudget.realizationStatus;
        ictBudget.realizationStatus = IctBudgetRealizationStatus.PURCHASING;
        ictBudget.realizedById = agentId;

        const saved = await this.ictBudgetRepo.save(ictBudget);

        await this.logActivity(
            saved.id,
            'PURCHASING_STARTED',
            fromStatus,
            IctBudgetRealizationStatus.PURCHASING,
            agentId,
        );

        return saved;
    }

    async markArrived(id: string, agentId: string, itemIds: string[]): Promise<IctBudgetRequest> {
        const ictBudget = await this.findOne(id);

        if (ictBudget.realizationStatus !== IctBudgetRealizationStatus.PURCHASING && 
            ictBudget.realizationStatus !== IctBudgetRealizationStatus.PARTIALLY_ARRIVED) {
            throw new BadRequestException('Can only mark arrived for requests in purchasing or partially arrived status');
        }

        const fromStatus = ictBudget.realizationStatus;

        // Update individual items
        let updatedCount = 0;
        ictBudget.items = ictBudget.items.map(item => {
            if (itemIds.includes(item.id)) {
                if (!item.isArrived) {
                    updatedCount++;
                }
                return { ...item, isArrived: true, arrivedAt: item.arrivedAt || new Date() };
            }
            return { ...item };
        });

        // Determine new status
        const allArrived = ictBudget.items.every(item => item.isArrived);
        const toStatus = allArrived ? IctBudgetRealizationStatus.ARRIVED : IctBudgetRealizationStatus.PARTIALLY_ARRIVED;

        ictBudget.realizationStatus = toStatus;
        ictBudget.realizedById = agentId;

        const saved = await this.ictBudgetRepo.save(ictBudget);

        await this.logActivity(
            saved.id,
            allArrived ? 'ALL_ITEMS_ARRIVED' : 'PARTIAL_ITEMS_ARRIVED',
            fromStatus,
            toStatus,
            agentId,
            `Ditandai tiba: ${updatedCount} item(s)`,
        );

        this.eventEmitter.emit('ict-budget.arrived', { ictBudget: saved, partial: !allArrived });

        return saved;
    }

    async realize(id: string, agentId: string, dto: RealizeIctBudgetDto): Promise<IctBudgetRequest> {
        const ictBudget = await this.findOne(id);

        if (ictBudget.realizationStatus !== IctBudgetRealizationStatus.ARRIVED && 
            ictBudget.realizationStatus !== IctBudgetRealizationStatus.PARTIALLY_ARRIVED) {
            throw new BadRequestException('Can only realize requests in arrived or partially arrived status');
        }

        const fromStatus = ictBudget.realizationStatus;
        ictBudget.realizationStatus = IctBudgetRealizationStatus.REALIZED;
        ictBudget.realizedById = agentId;
        ictBudget.realizedAt = new Date();
        ictBudget.purchaseOrderNumber = dto.purchaseOrderNumber || null;
        ictBudget.invoiceNumber = dto.invoiceNumber || null;
        ictBudget.realizationNotes = dto.realizationNotes || null;

        const saved = await this.ictBudgetRepo.save(ictBudget);

        await this.logActivity(
            saved.id,
            'REALIZED',
            fromStatus,
            IctBudgetRealizationStatus.REALIZED,
            agentId,
            dto.realizationNotes,
        );

        // Resolve original ticket
        await this.ticketRepo.update(ictBudget.ticketId, {
            status: TicketStatus.RESOLVED,
            resolvedAt: new Date(),
        });

        // Emit event
        this.eventEmitter.emit('ict-budget.realized', { ictBudget: saved });

        return saved;
    }

    async requestInstallation(id: string, user: { userId: string; role: string }, itemId: string, date: string, timeSlot: string): Promise<IctBudgetRequest> {
        const ictBudget = await this.findOne(id);
        
        const targetItem = ictBudget.items.find(i => i.id === itemId);
        if (!targetItem) throw new NotFoundException('Item not found in budget request');
        if (!targetItem.isArrived) throw new BadRequestException('Item must be arrived before requesting installation');
        if (targetItem.hasInstallationTicket) throw new BadRequestException('Installation ticket already created for this item');

        if (ictBudget.ticket.userId !== user.userId && user.role === 'USER') {
            throw new ForbiddenException('You can only request installation for your own requests');
        }

        // Simple validation for slots
        if (!this.SLOTS.includes(timeSlot)) {
            throw new BadRequestException('Invalid time slot');
        }

        await this.createHardwareInstallationTicket(ictBudget, itemId, date, timeSlot);
        
        return this.findOne(id);
    }

    async cancelRequest(id: string, user: { userId: string }): Promise<IctBudgetRequest> {
        const ictBudget = await this.findOne(id);

        if (ictBudget.realizationStatus !== IctBudgetRealizationStatus.PENDING) {
            throw new BadRequestException('Can only cancel pending requests');
        }

        if (ictBudget.ticket.userId !== user.userId) {
            throw new ForbiddenException('You can only cancel your own requests');
        }

        const fromStatus = ictBudget.realizationStatus;
        ictBudget.realizationStatus = IctBudgetRealizationStatus.CANCELLED;

        const saved = await this.ictBudgetRepo.save(ictBudget);

        await this.logActivity(
            saved.id,
            'CANCELLED',
            fromStatus,
            IctBudgetRealizationStatus.CANCELLED,
            user.userId,
            'Request cancelled by user',
        );

        await this.ticketRepo.update(ictBudget.ticketId, { status: TicketStatus.CANCELLED });
        this.eventEmitter.emit('ict-budget.cancelled', { ictBudget: saved });

        this.auditService.logAsync({
            userId: user.userId,
            action: AuditAction.ICT_BUDGET_CANCEL,
            entityType: 'IctBudgetRequest',
            entityId: saved.id,
            description: `Cancelled ICT Budget request`,
            oldValue: { realizationStatus: fromStatus },
            newValue: { realizationStatus: IctBudgetRealizationStatus.CANCELLED },
        });

        return saved;
    }

    async getActivities(ictBudgetId: string): Promise<IctBudgetActivity[]> {
        return this.activityRepo.find({
            where: { ictBudgetId },
            relations: ['performedBy'],
            order: { createdAt: 'ASC' },
        });
    }

    async findAllInstallations(
      user: { userId: string; role: string; siteId?: string },
      options: { page?: number; limit?: number; status?: string; siteId?: string; search?: string; startDate?: string; endDate?: string },
    ): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number }> {
      const page = options.page || 1;
      const limit = options.limit || 20;

      const qb = this.ticketRepo
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.user', 'requester')
        .leftJoinAndSelect('ticket.assignedTo', 'assignee')
        .leftJoinAndSelect('ticket.site', 'site')
        .leftJoin(
          'installation_schedules',
          'schedule',
          'schedule."ticketId"::uuid = ticket.id',
        )
        .addSelect([
          'schedule."ictBudgetRequestId"',
          'schedule."itemName"',
          'schedule."itemIndex"',
          'schedule."scheduledTimeSlot"',
        ])
        .where('ticket.ticketType = :type', { type: 'HARDWARE_INSTALLATION' })
        .andWhere('ticket.isHardwareInstallation = :isHw', { isHw: true });

      // Role-based site filtering
      if (user.role === 'USER') {
        qb.andWhere('ticket.userId = :userId', { userId: user.userId });
      } else if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.siteId) {
        qb.andWhere('ticket.siteId = :siteId', { siteId: user.siteId });
      }

      // Optional filters
      if (options.siteId) {
        qb.andWhere('ticket.siteId = :filterSiteId', { filterSiteId: options.siteId });
      }
      if (options.status) {
        qb.andWhere('ticket.status = :status', { status: options.status });
      }
      if (options.search) {
        qb.andWhere(
          '(ticket.title ILIKE :search OR ticket.ticketNumber ILIKE :search)',
          { search: `%${options.search}%` },
        );
      }
      
      if (options.startDate) {
        qb.andWhere('ticket.createdAt >= :startDate', { startDate: new Date(options.startDate) });
      }
      
      if (options.endDate) {
        // Add 1 day to end date to include the whole day
        const end = new Date(options.endDate);
        end.setDate(end.getDate() + 1);
        qb.andWhere('ticket.createdAt < :endDate', { endDate: end });
      }

      qb.orderBy('ticket.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [rawTickets, total] = await qb.getManyAndCount();

      // Fetch schedule data separately for clean mapping
      const ticketIds = rawTickets.map((t) => t.id);
      const schedules = ticketIds.length
        ? await this.scheduleRepo
            .createQueryBuilder('s')
            .where('s.ticketId IN (:...ticketIds)', { ticketIds })
            .getMany()
        : [];

      const scheduleMap = new Map(schedules.map((s) => [s.ticketId, s]));

      const data = rawTickets.map((ticket) => {
        const schedule = scheduleMap.get(ticket.id);
        return {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          status: ticket.status,
          hardwareType: ticket.hardwareType,
          scheduledDate: ticket.scheduledDate,
          scheduledTime: ticket.scheduledTime,
          site: ticket.site ? { id: ticket.site.id, name: ticket.site.name } : null,
          requester: ticket.user
            ? { id: ticket.user.id, fullName: ticket.user.fullName }
            : null,
          assignedTo: ticket.assignedTo
            ? { id: ticket.assignedTo.id, fullName: ticket.assignedTo.fullName }
            : null,
          ictBudgetRequestId: schedule?.ictBudgetRequestId || null,
          itemName: schedule?.itemName || null,
          itemIndex: schedule?.itemIndex ?? null,
          scheduledTimeSlot: schedule?.scheduledTimeSlot || null,
          createdAt: ticket.createdAt,
        };
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    async findOneInstallation(
      user: { userId: string; role: string; siteId?: string },
      ticketId: string,
    ): Promise<any> {
      const qb = this.ticketRepo
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.user', 'requester')
        .leftJoinAndSelect('ticket.assignedTo', 'assignee')
        .leftJoinAndSelect('ticket.site', 'site')
        .leftJoin(
          'installation_schedules',
          'schedule',
          'schedule."ticketId"::uuid = ticket.id',
        )
        .addSelect([
          'schedule.id',
          'schedule."ictBudgetRequestId"',
          'schedule.status',
          'schedule."itemName"',
          'schedule."itemIndex"',
          'schedule."scheduledTimeSlot"',
        ])
        .where('ticket.id = :ticketId', { ticketId })
        .andWhere('ticket.ticketType = :type', { type: 'HARDWARE_INSTALLATION' });

      // Role-based site filtering for viewing
      if (user.role === 'USER') {
        qb.andWhere('ticket.userId = :userId', { userId: user.userId });
      } else if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.siteId) {
        qb.andWhere('ticket.siteId = :siteId', { siteId: user.siteId });
      }

      const ticket = await qb.getOne();
      if (!ticket) {
        throw new NotFoundException('Hardware installation ticket not found or you do not have permission to view it');
      }

      const schedule = await this.scheduleRepo.findOne({ where: { ticketId: ticket.id } });
      let ictBudgetRequestResult = null;

      if (schedule && schedule.ictBudgetRequestId) {
        const ictBudget = await this.ictBudgetRepo.findOne({
          where: { id: schedule.ictBudgetRequestId },
          relations: ['ticket']
        });
        
        if (ictBudget) {
            ictBudgetRequestResult = {
                id: ictBudget.id,
                realizationStatus: ictBudget.realizationStatus,
                title: ictBudget.ticket?.title || 'Hardware Request'
            };
        }
      }

      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        hardwareType: ticket.hardwareType,
        scheduledDate: ticket.scheduledDate,
        scheduledTime: ticket.scheduledTime,
        site: ticket.site ? { id: ticket.site.id, name: ticket.site.name } : null,
        requester: ticket.user ? { id: ticket.user.id, fullName: ticket.user.fullName } : null,
        assignedTo: ticket.assignedTo ? { id: ticket.assignedTo.id, fullName: ticket.assignedTo.fullName } : null,
        schedule: schedule ? {
          id: schedule.id,
          status: schedule.status,
          ictBudgetRequestId: schedule.ictBudgetRequestId,
          itemName: schedule.itemName,
          itemIndex: schedule.itemIndex,
          scheduledTimeSlot: schedule.scheduledTimeSlot,
          scheduledDate: schedule.scheduledDate,
        } : null,
        ictBudgetRequest: ictBudgetRequestResult,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      };
    }

    async findRequestInstallations(
      ictBudgetId: string,
    ): Promise<{
      data: any[];
      total: number;
      installed: number;
      inProgress: number;
      scheduled: number;
    }> {
      const schedules = await this.scheduleRepo.find({
        where: { ictBudgetRequestId: ictBudgetId },
        order: { itemIndex: 'ASC' },
      });

      if (!schedules.length) {
        return { data: [], total: 0, installed: 0, inProgress: 0, scheduled: 0 };
      }

      const ticketIds = schedules
        .filter((s) => s.ticketId)
        .map((s) => s.ticketId);

      const tickets = ticketIds.length
        ? await this.ticketRepo.find({
            where: ticketIds.map((id) => ({ id })),
            relations: ['assignedTo'],
          })
        : [];

      const ticketMap = new Map(tickets.map((t) => [t.id, t]));

      let installed = 0;
      let inProgress = 0;
      let scheduled = 0;

      const data = schedules.map((schedule) => {
        const ticket = schedule.ticketId ? ticketMap.get(schedule.ticketId) : null;
        const status = ticket?.status || 'TODO';

        if (status === 'RESOLVED') installed++;
        else if (status === 'IN_PROGRESS') inProgress++;
        else scheduled++;

        return {
          id: ticket?.id || schedule.id,
          ticketNumber: ticket?.ticketNumber || null,
          title: ticket?.title || `Installation: ${schedule.itemName}`,
          status,
          hardwareType: ticket?.hardwareType || null,
          scheduledDate: ticket?.scheduledDate || schedule.scheduledDate,
          scheduledTime: ticket?.scheduledTime || null,
          scheduledTimeSlot: schedule.scheduledTimeSlot,
          assignedTo: ticket?.assignedTo
            ? { id: ticket.assignedTo.id, fullName: ticket.assignedTo.fullName }
            : null,
          itemIndex: schedule.itemIndex,
          itemName: schedule.itemName,
          scheduleStatus: schedule.status,
          createdAt: ticket?.createdAt || schedule.createdAt,
        };
      });

      return {
        data,
        total: data.length,
        installed,
        inProgress,
        scheduled,
      };
    }

    private async logActivity(
        ictBudgetId: string,
        action: string,
        fromStatus: IctBudgetRealizationStatus | null,
        toStatus: IctBudgetRealizationStatus,
        performedById: string,
        notes: string | null = null,
    ) {
        const activity = this.activityRepo.create({
            ictBudgetId,
            action,
            fromStatus,
            toStatus,
            performedById,
            notes,
        } as any);
        await this.activityRepo.save(activity);
    }

    private async createHardwareInstallationTicket(ictBudget: IctBudgetRequest, itemId: string, date: string, timeSlot: string): Promise<Ticket> {
        const originalTicket = await this.ticketRepo.findOne({
            where: { id: ictBudget.ticketId },
            relations: ['user'],
        });

        const targetItem = ictBudget.items.find(i => i.id === itemId);
        if (!targetItem) throw new NotFoundException('Item not found in budget request');

        const hwTicket = this.ticketRepo.create({
            title: `Hardware Installation: ${targetItem.name}`,
            description: `Hardware installation untuk ${targetItem.name} dari ICT Budget Request #${originalTicket?.ticketNumber || ictBudget.id}`,
            ticketType: TicketType.HARDWARE_INSTALLATION,
            status: TicketStatus.TODO,
            priority: 'MEDIUM',
            category: 'HARDWARE',
            userId: originalTicket ? originalTicket.userId : null,
            siteId: originalTicket ? originalTicket.siteId : null,
            isHardwareInstallation: true,
            hardwareType: ictBudget.budgetCategory,
        } as Partial<Ticket>);

        const savedHwTicket = await this.ticketRepo.save(hwTicket);

        const schedule = this.scheduleRepo.create({
            ictBudgetRequestId: ictBudget.id,
            ticketId: savedHwTicket.id,
            itemName: targetItem.name,
            itemIndex: ictBudget.items.findIndex(i => i.id === itemId),
            requesterId: originalTicket ? originalTicket.userId : null,
            scheduledDate: new Date(date),
            scheduledTimeSlot: timeSlot,
            status: ScheduleStatus.PENDING,
        } as Partial<InstallationSchedule>);

        await this.scheduleRepo.save(schedule);

        // Update item array
        ictBudget.items = ictBudget.items.map(item => {
            if (item.id === itemId) {
                return { ...item, hasInstallationTicket: true };
            }
            return item;
        });

        await this.ictBudgetRepo.save(ictBudget);

        return savedHwTicket;
    }
}
