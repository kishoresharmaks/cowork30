import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports & Analytics')
@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'staff')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('executive-summary')
  @ApiOperation({ summary: 'Admin/Staff: Get high-level executive analytics and summary metrics' })
  async getExecutiveSummary() {
    return this.reportsService.getExecutiveSummary();
  }

  @Get('export-csv')
  @ApiOperation({ summary: 'Admin/Staff: Export bookings, payments, or wallet transactions to CSV format' })
  async exportCsvData(
    @Query('type') type: 'bookings' | 'payments' | 'wallet' = 'bookings',
    @Res() res: any,
  ) {
    const csvContent = await this.reportsService.exportCsvData(type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=cowork30_${type}_report.csv`);
    return res.send(csvContent);
  }
}
