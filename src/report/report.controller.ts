import { Body, Controller, Get, Post } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('/all-reports')
  async getAllReports() {
    return await this.reportService.getAllReports();
  }
  @Post('/create-report')
  async createReport(@Body() createReportDto: CreateReportDto) {
    return await this.reportService.createReport(createReportDto);
  }

}
