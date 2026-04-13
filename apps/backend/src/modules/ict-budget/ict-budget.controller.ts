import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IctBudgetService } from './ict-budget.service';
import { CreateIctBudgetDto, ApproveIctBudgetDto, RealizeIctBudgetDto, MarkArrivedDto, RequestInstallationDto } from './dto';
import { InstallationQueryDto } from './dto/installation-query.dto';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/core/guards/roles.guard';
import { Roles } from '../../shared/core/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('ICT Budget')
@ApiBearerAuth()
@Controller('ict-budget')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IctBudgetController {
    constructor(private readonly ictBudgetService: IctBudgetService) { }

    @Post()
    @ApiOperation({ summary: 'Create ICT Budget request' })
    create(@Request() req: any, @Body() dto: CreateIctBudgetDto) {
        return this.ictBudgetService.create(req.user.userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all ICT Budget requests' })
    @ApiQuery({ name: 'siteId', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'search', required: false })
    @Roles(
        UserRole.ADMIN, 
        UserRole.MANAGER, 
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE,
        UserRole.USER
    )
    findAll(
        @Request() req: any,
        @Query('siteId') siteId?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.ictBudgetService.findAll(req.user, { 
            siteId, 
            status,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            search
        });
    }

    @Get('installations/stats')
    @ApiOperation({ summary: 'Get hardware installation stats' })
    @Roles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE,
        UserRole.USER,
    )
    async getInstallationStats(@Request() req: any) {
        return this.ictBudgetService.getInstallationStats(req.user);
    }

    @Get('summary-counts')
    @ApiOperation({ summary: 'Get summary counts for all status tabs' })
    @Roles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE,
        UserRole.USER,
    )
    async getSummaryCounts(@Request() req: any) {
        return this.ictBudgetService.getSummaryCounts(req.user);
    }

    @Get('installations')
    @ApiOperation({ summary: 'Get all hardware installation tickets across all requests' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String, description: 'TODO, IN_PROGRESS, RESOLVED' })
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiQuery({ name: 'siteId', required: false, type: String })
    @ApiQuery({ name: 'search', required: false, type: String })
    @Roles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE,
        UserRole.USER,
    )
    async findAllInstallations(
        @Request() req: any,
        @Query() query: InstallationQueryDto,
    ) {
        return this.ictBudgetService.findAllInstallations(req.user, {
            page: parseInt(query.page as any) || 1,
            limit: parseInt(query.limit as any) || 20,
            status: query.status,
            siteId: query.siteId,
            search: query.search,
            startDate: query.startDate,
            endDate: query.endDate,
        });
    }

    @Get('installations/:ticketId')
    @ApiOperation({ summary: 'Get a single hardware installation ticket detail' })
    @Roles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE,
        UserRole.USER,
    )
    async findOneInstallation(
        @Request() req: any,
        @Param('ticketId', ParseUUIDPipe) ticketId: string,
    ) {
        return this.ictBudgetService.findOneInstallation(req.user, ticketId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get ICT Budget request by ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ictBudgetService.findOne(id);
    }

    @Get(':id/installations')
    @ApiOperation({ summary: 'Get installation tickets for a specific ICT budget request' })
    async findRequestInstallations(
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.ictBudgetService.findRequestInstallations(id);
    }

    @Get('ticket/:ticketId')
    @ApiOperation({ summary: 'Get ICT Budget request by ticket ID' })
    findByTicketId(@Param('ticketId', ParseUUIDPipe) ticketId: string) {
        return this.ictBudgetService.findByTicketId(ticketId);
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve or reject ICT Budget request (Superior/Agent/Admin)' })
    @Roles(
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE
    )
    approve(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
        @Body() dto: ApproveIctBudgetDto,
    ) {
        return this.ictBudgetService.approve(id, req.user.userId, dto);
    }

    @Patch(':id/purchasing')
    @ApiOperation({ summary: 'Start purchasing process' })
    @Roles(
        UserRole.ADMIN, 
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE
    )
    startPurchasing(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ) {
        return this.ictBudgetService.startPurchasing(id, req.user.userId);
    }

    @Patch(':id/arrived')
    @ApiOperation({ summary: 'Mark item as arrived' })
    @Roles(
        UserRole.ADMIN, 
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE
    )
    markArrived(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
        @Body() dto: MarkArrivedDto,
    ) {
        return this.ictBudgetService.markArrived(id, req.user.userId, dto.itemIds);
    }

    @Patch(':id/realize')
    @ApiOperation({ summary: 'Mark ICT Budget request as realized' })
    @Roles(
        UserRole.ADMIN, 
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE
    )
    realize(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
        @Body() dto: RealizeIctBudgetDto,
    ) {
        return this.ictBudgetService.realize(id, req.user.userId, dto);
    }

    @Patch(':id/item/:itemId/install')
    @ApiOperation({ summary: 'Request installation for a specific arrived item' })
    @Roles(
        UserRole.USER,
        UserRole.ADMIN, 
        UserRole.MANAGER, 
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE
    )
    requestInstallation(
        @Request() req: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Param('itemId', ParseUUIDPipe) itemId: string,
        @Body() body: RequestInstallationDto
    ) {
        return this.ictBudgetService.requestInstallation(id, req.user, itemId, body.date, body.timeSlot);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel a pending ICT Budget request' })
    @Roles(UserRole.USER)
    cancelRequest(
        @Request() req: any,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.ictBudgetService.cancelRequest(id, req.user);
    }

    @Get(':id/activities')
    @ApiOperation({ summary: 'Get activity log for an ICT Budget request' })
    @Roles(
        UserRole.USER,
        UserRole.ADMIN, 
        UserRole.MANAGER, 
        UserRole.AGENT,
        UserRole.AGENT_OPERATIONAL_SUPPORT,
        UserRole.AGENT_ADMIN,
        UserRole.AGENT_ORACLE
    )
    getActivities(@Param('id', ParseUUIDPipe) id: string) {
        return this.ictBudgetService.getActivities(id);
    }
}

