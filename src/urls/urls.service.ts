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
  scrapingCriteriaGenerator,
  unlinkFile,
  validateUrl,
} from '../helpers';
import { ParserService } from '../parser/parser.service';
import { IClassNames } from '../common/interfaces/IClassNames';

@Injectable()
export class UrlsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly parserService: ParserService,
  ) {}

  async sitemapListParse(websiteUrl: UrlDto, classNames: IClassNames) {
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
        await scrapingCriteriaGenerator(validatedUrl, classNames);
      }
    } catch (error) {
      throw new BadRequestException('Something bad happened', {
        cause: new Error(),
        description: `Something bad happened while parsing sitemap`,
      });
    }
  }

  async getValidSitemapUrl(siteUrl: string) {
    return await this.getSitemapFromRobotsTxt(siteUrl);
    // let sitemapUrl = null;
    // for (const sitemap of SITEMAP_VARIANTS_LIST) {
    //   const { url, status } = await this.getSitemapUrl(`${siteUrl}${sitemap}`);
    //
    //   if (status === HttpStatus.OK) {
    //     sitemapUrl = url;
    //   }
    // }
    // // TODO: if sitemap not found check if it exists in robots.txt
    // return sitemapUrl;
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

  async storeUrls(url: string, urlList: string[]) {
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

  async checkWebsiteHasSitemapUrl(websiteUrl: UrlDto): Promise<any> {
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

    if (correctSitemapUrl === null) return [];
    const sitemap = new Sitemapper({
      url: `${correctSitemapUrl}`,
      timeout: 15000000, // 15 seconds
    });

    try {
      const { sites } = await sitemap.fetch();

      if (sites.length) {
        return sites;
      }

      return [];
    } catch (error) {
      throw new BadRequestException('Something bad happened', {
        cause: new Error(),
        description: `Something bad happened while parsing sitemap`,
      });
    }
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
      const { data, status } = await lastValueFrom(
        this.httpService.get(`${websiteUrl}robots.txt`),
      );
      // const robotsUrl = new URL('/robots.txt', websiteUrl).href;
      // const response = await axios.get(robotsUrl);
      //
      const sitemapUrls: string[] = [];

      const lines = data.split('\n');
      for (const line of lines) {
        console.log(line, line.match(/^sitemap|Sitemap:\s*(.+)$/i));
        const match = line.match(/^sitemap|Sitemap:\s*(.+)$/i);
        if (match) {
          sitemapUrls.push(match[1].trim());
        }
      }
      return sitemapUrls;
    } catch (error) {
      console.error('Error fetching robots.txt:', error.message);
      return [];
    }
  }
}
