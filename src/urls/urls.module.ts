import { Module } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [UrlsService],
  controllers: [],
  exports: [UrlsService],
  imports: [HttpModule],
})
export class UrlsModule {}
