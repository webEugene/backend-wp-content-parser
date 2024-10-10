import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WpDetectModule } from './wp-detect/wp-detect.module';
import { UrlsController } from './urls/urls.controller';
import { UrlsModule } from './urls/urls.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/parser'),
    UrlsModule,
    WpDetectModule,
  ],
  controllers: [UrlsController],
})
export class AppModule {}
