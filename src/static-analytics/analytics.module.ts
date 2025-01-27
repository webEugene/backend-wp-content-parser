import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AnalyticsWpDetect,
  AnalyticsWpDetectSchema,
} from '../schemas/analytics-wp-detect.schemas';
import {
  AnalyticsSitemapTest,
  AnalyticsSitemapTestSchema,
} from '../schemas/analytics-sitemap-test.schemas';
import { AnalyticsController } from './analytics.controller';

@Module({
  providers: [AnalyticsService],
  exports: [AnalyticsService],
  imports: [
    MongooseModule.forFeature([
      {
        name: AnalyticsWpDetect.name,
        schema: AnalyticsWpDetectSchema,
      },
      {
        name: AnalyticsSitemapTest.name,
        schema: AnalyticsSitemapTestSchema,
      },
    ]),
  ],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
