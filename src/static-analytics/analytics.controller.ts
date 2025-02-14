import { Controller, Get, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('/wp-check')
  async getWpCheckAnalytics(@Req() request: any) {
    return await this.analyticsService.getWpCheckAnalytics(request.query);
  }

  @Get('/sitemap-test')
  async getSitemapTestAnalytics(@Req() request: any) {
    return await this.analyticsService.getSitemapTestAnalytics(request.query);
  }
}
