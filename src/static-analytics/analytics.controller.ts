import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('/wp-check')
  async getWpCheckAnalytics() {
    return await this.analyticsService.getWpCheckAnalytics();
  }

  @Get('/sitemap-test')
  async getSitemapTestAnalytics() {
    return await this.analyticsService.getSitemapTestAnalytics();
  }
}
