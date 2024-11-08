import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
import { WpDetectModule } from './wp-detect/wp-detect.module';
import { UrlsController } from './urls/urls.controller';
import { UrlsModule } from './urls/urls.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ParserModule } from './parser/parser.module';

@Module({
  imports: [
    // MongooseModule.forRoot('mongodb://localhost:27017/parser'),
    UrlsModule,
    WpDetectModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
    }),
    ParserModule,
  ],
  controllers: [UrlsController],
})
export class AppModule {}
