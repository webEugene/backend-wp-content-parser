import { Module } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { HttpModule } from '@nestjs/axios';
import { StaticAnalyticsModule } from '../static-analytics/static-analytics.module';

@Module({
  providers: [UrlsService],
  controllers: [],
  exports: [UrlsService],
  imports: [HttpModule, StaticAnalyticsModule],
})
export class UrlsModule {}
