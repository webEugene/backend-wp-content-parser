import { Module } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsModule } from '../static-analytics/analytics.module';

@Module({
  providers: [UrlsService],
  controllers: [],
  exports: [UrlsService],
  imports: [HttpModule, AnalyticsModule],
})
export class UrlsModule {}
