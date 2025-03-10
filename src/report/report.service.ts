import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Report } from '../schemas/report.schema';
import { Model } from 'mongoose';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<Report>) {}

  async createReport(createReportDto: CreateReportDto) {
    const newReport = new this.reportModel(createReportDto);
    return newReport.save();
  }

  async getAllReports(): Promise<Report[]> {
    return this.reportModel.find();
  }
}
