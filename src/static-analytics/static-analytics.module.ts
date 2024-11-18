import { Module } from '@nestjs/common';
import { StaticAnalyticsService } from './static-analytics.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Analytics, AnalyticsSchema } from '../schemas/Analytics.schemas';

@Module({
  providers: [StaticAnalyticsService],
  exports: [StaticAnalyticsService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Analytics.name,
        schema: AnalyticsSchema,
      },
    ]),
  ],
})
export class StaticAnalyticsModule {}
