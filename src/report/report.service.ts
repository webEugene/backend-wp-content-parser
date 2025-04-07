import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Report } from '../schemas/report.schema';
import { Model } from 'mongoose';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<Report>) {}

  async createReport(createReportDto: CreateReportDto) {
    const report = new this.reportModel(createReportDto, {
      $set: { status: 0 },
    });

    const newReport = report.save();
    if (!newReport) {
      return;
    }
    return {
      statusCode: HttpStatus.CREATED,
    };
  }

  async getAllReports(): Promise<Report[]> {
    return this.reportModel.find();
  }
}
