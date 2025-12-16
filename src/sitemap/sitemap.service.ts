import { HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {  SITEMAP_VARIANTS_LIST } from '../common/constants';
import { ParserService } from '../parser/parser.service';

@Injectable()
export class SitemapService {
  constructor(
    private readonly httpService: HttpService,
    private readonly parserService: ParserService,
  ) {}

  async getValidSitemapUrl(siteUrl: string): Promise<string[]> {
    const isSitemapExist: string[] =
      await this.getSitemapFromRobotsTxt(siteUrl);
    if (isSitemapExist && isSitemapExist.length) {
      return isSitemapExist;
    }
    console.log(isSitemapExist);
    const sitemapUrl: string[] = [];
    for (const sitemap of SITEMAP_VARIANTS_LIST) {
      const { url, status } = await this.getSitemapUrl(`${siteUrl}${sitemap}`);

      if (status === HttpStatus.OK) {
        sitemapUrl.push(url);
      }
    }

    return sitemapUrl;
  }

  async getSitemapUrl(url: string): Promise<{
    url: string;
    status: number;
    error: null | string;
  }> {
    try {
      const result = await this.parserService.parseHtmlByPuppeteer(url);
      return {
        url,
        status: result.statusCode,
        error: null,
      };
    } catch (error) {
      return {
        url,
        status: 404,
        error: error.message,
      };
    }
  }

  async getSitemapFromRobotsTxt(websiteUrl: string) {
    try {
      const result = await this.parserService.parseHtmlByPuppeteer(
        `${websiteUrl}robots.txt`,
      );

      const sitemapUrls: string[] = [];

      const lines = result.content!.split('\n');

      for (const line of lines) {
        const match = line.match(/^sitemap|Sitemap:\s*(https?:\/\/[^\s<]+)/m);
        if (match) {
          sitemapUrls.push(match[1].trim());
        }
      }

      return sitemapUrls;
    } catch (error) {
      return [];
    }
  }
}
