import { Module } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsModule } from '../static-analytics/analytics.module';
import { ParserModule } from '../parser/parser.module';

@Module({
  providers: [UrlsService],
  controllers: [],
  exports: [UrlsService],
  imports: [HttpModule, AnalyticsModule, ParserModule],
})
export class UrlsModule {}
