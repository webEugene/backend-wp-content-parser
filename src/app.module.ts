import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WpDetectModule } from './wp-detect/wp-detect.module';
import { UrlsController } from './urls/urls.controller';
import { UrlsModule } from './urls/urls.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ParserModule } from './parser/parser.module';
import { ParseDbController } from './parse-db/parse-db.controller';
import { ParseDbModule } from './parse-db/parse-db.module';
import { AnalyticsModule } from './static-analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { AnalyticsController } from './static-analytics/analytics.controller';
import { ReportController } from './report/report.controller';
import { ReportModule } from './report/report.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 5,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 10,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`./.env`],
    }),
    MongooseModule.forRoot(process.env.DATABASE_URI, {
      dbName: process.env.DATABASE_NAME,
    }),
    UrlsModule,
    WpDetectModule,
    ParserModule,
    AnalyticsModule,
    ParseDbModule,
    AuthModule,
    UserModule,
    ReportModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
    }),
  ],
  controllers: [
    UrlsController,
    ParseDbController,
    AnalyticsController,
    ReportController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
