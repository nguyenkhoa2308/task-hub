import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@Controller('reports')
@ApiTags('Reports')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('workspace/:id.csv')
  async workspace(@Param('id') id: string, @Req() req: any, @Res() response: Response) {
    const report = await this.reportsService.exportWorkspace(id, req.user.userId);
    this.sendCsv(response, report.filename, report.csv);
  }

  @Get('project/:id.csv')
  async project(@Param('id') id: string, @Req() req: any, @Res() response: Response) {
    const report = await this.reportsService.exportProject(id, req.user.userId);
    this.sendCsv(response, report.filename, report.csv);
  }

  private sendCsv(response: Response, filename: string, csv: string) {
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.send(`\uFEFF${csv}`);
  }
}
