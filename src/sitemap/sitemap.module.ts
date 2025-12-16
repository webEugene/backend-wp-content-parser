import { Module } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { HttpModule } from '@nestjs/axios';
import { ParserModule } from '../parser/parser.module';

@Module({
  providers: [SitemapService],
  exports: [SitemapService],
  imports: [HttpModule, ParserModule],
})
export class SitemapModule {}
