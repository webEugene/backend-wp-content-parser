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
  validateUrl,
  isExistHostFile,
  unlinkFile,
  scrapingCriteriaGenerator,
} from '../helpers';

@Injectable()
export class UrlsService {
  constructor(private readonly httpService: HttpService) {}

  async sitemapListParse(websiteUrl: UrlDto, classNames) {
    const validUrl = await validateUrl(websiteUrl.url);
    const correctSitemapUrl = await this.getValidSitemapUrl(validUrl);

    if (correctSitemapUrl === null) return [];
    const sitemap = new Sitemapper({
      url: `${correctSitemapUrl}`,
      timeout: 15000, // 15 seconds
    });

    try {
      const { sites } = await sitemap.fetch();

      if (sites.length) {
        await this.storeUrls(validUrl, sites);
        await scrapingCriteriaGenerator(validUrl, classNames);
      }
    } catch (error) {
      throw new BadRequestException('Something bad happened', {
        cause: new Error(),
        description: `Something bad happened while parsing sitemap`,
      });
    }
  }

  async getValidSitemapUrl(siteUrl: string) {
    let sitemapUrl = null;
    for (const sitemap of SITEMAP_VARIANTS_LIST) {
      const { url, status } = await this.getSitemapUrl(`${siteUrl}${sitemap}`);

      if (status === HttpStatus.OK) {
        sitemapUrl = url;
      }
    }

    return sitemapUrl;
  }

  async getSitemapUrl(url): Promise<{
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

  async storeUrls(url, urlList) {
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
      await unlinkFile({
        host,
        directory: CRITERIA_DIR,
        fileName: '',
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
}
