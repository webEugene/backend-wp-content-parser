import { Controller, Get } from '@nestjs/common';
import { StaticAnalyticsService } from './static-analytics.service';

@Controller('analytics')
export class StaticAnalyticsController {
  constructor(
    private readonly staticAnalyticsService: StaticAnalyticsService,
  ) {}

  @Get()
  async getAnalytics() {
    return await this.staticAnalyticsService.getAnalytics();
  }
}
