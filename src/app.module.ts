import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WpDetectModule } from './wp-detect/wp-detect.module';
import { UrlsController } from './urls/urls.controller';
import { UrlsModule } from './urls/urls.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ParserModule } from './parser/parser.module';
import { AnalyticsModule } from './static-analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { AnalyticsController } from './static-analytics/analytics.controller';
import { ReportController } from './report/report.controller';
import { ReportModule } from './report/report.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { SecurityLoggingInterceptor } from './core/interceptors/security-logging.interceptor';
import { Logger } from 'winston';
import { WinstonModule } from 'nest-winston';
import { AwsModule } from './aws/aws.module';

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
    AuthModule,
    UserModule,
    ReportModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
    }),
    WinstonModule.forRoot({
      // options
    }),
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
    AwsModule,
  ],
  controllers: [
    UrlsController,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: Logger,
    },
  ],
})
export class AppModule {}
