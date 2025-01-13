import { Module } from '@nestjs/common';
import { StaticAnalyticsService } from './static-analytics.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Analytics, AnalyticsSchema } from '../schemas/analytics.schemas';
import { StaticAnalyticsController } from './static-analytics.controller';

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
  controllers: [StaticAnalyticsController],
})
export class StaticAnalyticsModule {}
