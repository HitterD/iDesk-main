import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IctBudgetRequest } from './entities/ict-budget-request.entity';
import { IctBudgetActivity } from './entities/ict-budget-activity.entity';
import { IctBudgetService } from './ict-budget.service';
import { IctBudgetController } from './ict-budget.controller';
import { Ticket } from '../ticketing/entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { InstallationSchedule } from '../ticketing/entities/installation-schedule.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';
import { TelegramModule } from '../telegram/telegram.module';
import { IctBudgetNotificationListener } from './listeners/ict-budget-notification.listener';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([IctBudgetRequest, Ticket, User, IctBudgetActivity, InstallationSchedule]),
        AuthModule,
        NotificationModule,
        TelegramModule,
        AuditModule,
    ],
    controllers: [IctBudgetController],
    providers: [IctBudgetService, IctBudgetNotificationListener],
    exports: [IctBudgetService],
})
export class IctBudgetModule { }
