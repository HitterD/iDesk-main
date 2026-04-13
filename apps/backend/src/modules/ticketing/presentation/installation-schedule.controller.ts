import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/core/guards/roles.guard';
import { InstallationScheduleService } from '../services/installation-schedule.service';

@ApiTags('Installation Schedule')
@Controller('installation-schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InstallationScheduleController {
    constructor(private readonly scheduleService: InstallationScheduleService) {}

    @Get('available-slots')
    @ApiOperation({ summary: 'Get available time slots for a specific date' })
    async getAvailableSlots(@Query('date') date: string) {
        return this.scheduleService.getAvailableSlots(date);
    }

    @Get('monthly-availability')
    @ApiOperation({ summary: 'Get available time slots for a specific month' })
    async getMonthlyAvailability(
        @Query('year') year: string,
        @Query('month') month: string
    ) {
        return this.scheduleService.getMonthlyAvailability(parseInt(year), parseInt(month));
    }

    @Get()
    @ApiOperation({ summary: 'Get all schedules' })
    async getAllSchedules() {
        return this.scheduleService.getAllSchedules();
    }

    @Get('budget/:id')
    @ApiOperation({ summary: 'Get schedules by ICT budget request ID' })
    async getSchedulesByBudget(@Param('id') id: string) {
        return this.scheduleService.getSchedulesByBudgetRequest(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new schedule (User select slot)' })
    async createSchedule(@Req() req: any, @Body() data: any) {
        return this.scheduleService.createSchedule({
            ...data,
            requesterId: req.user.id
        });
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve a schedule (Agent/Admin)' })
    async approveSchedule(@Req() req: any, @Param('id') id: string) {
        return this.scheduleService.approveSchedule(id, req.user.id);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Complete an installation (Agent/Admin)' })
    async completeSchedule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.scheduleService.completeSchedule(id, req.user.id, body.notes);
    }

    @Patch(':id/reschedule')
    @ApiOperation({ summary: 'Reschedule an installation (Agent/Admin)' })
    async reschedule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
        return this.scheduleService.reschedule(id, req.user.id, body.date, body.timeSlot, body.reason);
    }
}
