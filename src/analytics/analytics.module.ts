import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserAnalytics,
  UserAnalyticsSchema,
} from './schemas/user-analytics.schema';
import { LoginEvent, LoginEventSchema } from './schemas/login-event.schema';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  imports: [
    MongooseModule.forFeature([
      {
        name: UserAnalytics.name,
        schema: UserAnalyticsSchema,
      },
      {
        name: LoginEvent.name,
        schema: LoginEventSchema,
      },
    ]),
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
