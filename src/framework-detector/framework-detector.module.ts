import { Module } from '@nestjs/common';
import { FrameworkDetectorService } from './framework-detector.service';

@Module({
  providers: [FrameworkDetectorService],
  exports: [FrameworkDetectorService],
})
export class FrameworkDetectorModule {}
