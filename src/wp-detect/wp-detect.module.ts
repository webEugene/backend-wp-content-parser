import { Module } from '@nestjs/common';
import { WpDetectService } from './wp-detect.service';
import { HttpModule } from '@nestjs/axios';
import { UrlsModule } from '../urls/urls.module';

@Module({
  providers: [WpDetectService],
  exports: [WpDetectService],
  imports: [HttpModule, UrlsModule],
})
export class WpDetectModule {}
