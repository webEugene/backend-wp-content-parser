import { Module } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [SitemapService],
  exports: [SitemapService],
  imports: [HttpModule],
})
export class SitemapModule {}
