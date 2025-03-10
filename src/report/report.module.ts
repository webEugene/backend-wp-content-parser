import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportSchema, Report } from '../schemas/report.schema';

@Module({
  providers: [ReportService],
  exports: [ReportService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Report.name,
        schema: ReportSchema,
      },
    ]),
  ],
  controllers: [],
})
export class ReportModule {}
