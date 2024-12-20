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
import { StaticAnalyticsModule } from './static-analytics/static-analytics.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
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
    StaticAnalyticsModule,
    ParseDbModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [UrlsController, ParseDbController],
})
export class AppModule {}
