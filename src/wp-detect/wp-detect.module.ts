import { Module } from '@nestjs/common';
import { WpDetectService } from './wp-detect.service';
import { HttpModule } from '@nestjs/axios';
import { UrlsModule } from '../urls/urls.module';
import { ParserModule } from '../parser/parser.module';
import { FrameworkDetectorModule } from '../framework-detector/framework-detector.module';

@Module({
  providers: [WpDetectService],
  exports: [WpDetectService],
  imports: [HttpModule, UrlsModule, ParserModule, FrameworkDetectorModule],
})
export class WpDetectModule {}
