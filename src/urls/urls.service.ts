import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { UrlDto } from './dto/url-dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import Sitemapper from 'sitemapper';
import * as fs from 'node:fs/promises';
import {
  CRITERIA_DIR,
  SITEMAP_URLS_DIR,
  SITEMAP_VARIANTS_LIST,
} from '../common/constants';
import {
  cleanHostname,
  isExistHostFile,
  unlinkFile,
  validateUrl,
} from '../helpers';
import { ParserService } from '../parser/parser.service';

@Injectable()
export class UrlsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly parserService: ParserService,
  ) {}

  async sitemapListParse(websiteUrl: UrlDto) {
    const validatedUrl = await validateUrl(websiteUrl.url);
    const correctSitemapUrl = await this.getValidSitemapUrl(validatedUrl);

    if (correctSitemapUrl === null) return [];
    const sitemap = new Sitemapper({
      url: `${correctSitemapUrl}`,
      timeout: 15000, // 15 seconds
    });

    try {
      const { sites } = await sitemap.fetch();

      if (sites.length) {
        await this.storeUrls(validatedUrl, sites);
      }
    } catch (error) {
      throw new BadRequestException('Something bad happened', {
        cause: new Error(),
        description: `Something bad happened while parsing sitemap`,
      });
    }
  }

  async getValidSitemapUrl(siteUrl: string): Promise<string[]> {
    const isSitemapExist: string[] =
      await this.getSitemapFromRobotsTxt(siteUrl);

    if (isSitemapExist && isSitemapExist.length) {
      return isSitemapExist;
    }

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
      const { status } = await lastValueFrom(this.httpService.get(url));
      return {
        url,
        status,
        error: null,
      };
    } catch (error) {
      // Return status 0 for failed requests
      return {
        url,
        status: 404,
        error: error.message,
      };
    }
  }

  async storeUrls(url: string, urlList: string[]): Promise<void> {
    const host: string = cleanHostname(url);
    const isFileSitemapExist: boolean = await isExistHostFile({
      host,
      directory: SITEMAP_URLS_DIR,
      fileName: '_sitemap_url',
    });

    if (isFileSitemapExist) {
      await unlinkFile({
        host,
        directory: SITEMAP_URLS_DIR,
        fileName: '_sitemap_url',
      });
    }

    try {
      await fs.writeFile(
        `${SITEMAP_URLS_DIR}/${host}_sitemap_url.json`,
        JSON.stringify(urlList, null, 1),
        { encoding: 'utf8', mode: '0644', flag: 'a' },
      );
    } catch (e) {
      throw new BadRequestException('Something bad happened', {
        cause: new Error(),
        description: `Something bad happened while writing to file ${SITEMAP_URLS_DIR}/${host}_sitemap_url.json`,
      });
    }
  }

  async checkWebsiteHasSitemapUrl(websiteUrl: UrlDto): Promise<string[]> {
    try {
      const validUrl = await validateUrl(websiteUrl.url);

      return await this.getValidSitemapUrl(validUrl);
    } catch (error) {
      return error;
    }
  }

  async getSitemapExtractedList(websiteUrl: UrlDto): Promise<any> {
    const validUrl = await validateUrl(websiteUrl.url);
    const correctSitemapUrl = await this.getValidSitemapUrl(validUrl);

    if (correctSitemapUrl.length === 0) return [];

    const fetchPromises = correctSitemapUrl.map(
      async (url: string): Promise<string[]> => {
        const sitemap = new Sitemapper({ url, timeout: 15000 });

        const res = await sitemap.fetch();
        return res.sites;
      },
    );

    const results = await Promise.allSettled(fetchPromises);

    const allSites: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allSites.push(...result.value);
      } else {
        console.warn(`Failed to fetch a sitemap:`, result.reason?.message);
        throw new BadRequestException('Something bad happened', {
          cause: new Error(),
          description: `Failed to fetch a sitemap`,
        });
      }
    }

    // Optionally deduplicate the URLs
    return Array.from(new Set(allSites));
  }

  async grabLinks(websiteUrl: UrlDto): Promise<any> {
    try {
      const validUrl = await validateUrl(websiteUrl.url);
      const domainName = new URL(validUrl);

      const grabbedLinks = await this.parserService.grabAllLinksFromPage(
        validUrl,
        domainName.origin,
      );
      return {
        domain: domainName.origin,
        data: grabbedLinks,
      };
    } catch (error) {
      return error;
    }
  }

  async getSitemapFromRobotsTxt(websiteUrl: string) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get(`${websiteUrl}robots.txt`),
      );
      const sitemapUrls: string[] = [];

      const lines = data.split('\n');
      for (const line of lines) {
        const match = line.match(/^sitemap|Sitemap:\s*(.+)$/m);
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
