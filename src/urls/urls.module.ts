import { Module } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { HttpModule } from '@nestjs/axios';
import { AnalyticsModule } from '../static-analytics/analytics.module';
import { ParserModule } from '../parser/parser.module';
import { AwsModule } from '../aws/aws.module';
import { SitemapModule } from '../sitemap/sitemap.module';

@Module({
  providers: [UrlsService],
  controllers: [],
  exports: [UrlsService],
  imports: [
    HttpModule,
    AnalyticsModule,
    ParserModule,
    AwsModule,
    SitemapModule,
  ],
})
export class UrlsModule {}
