import { BadRequestException, Injectable } from '@nestjs/common';
import { UrlDto } from './dto/url-dto';
import Sitemapper from 'sitemapper';
import { SITEMAP_URLS_DIR } from '../common/constants';
import { cleanHostname, validateUrl } from '../helpers';
import { ParserService } from '../parser/parser.service';
import { AwsService } from '../aws/aws.service';
import { SitemapService } from '../sitemap/sitemap.service';

@Injectable()
export class UrlsService {
  constructor(
    private readonly parserService: ParserService,
    private readonly awsService: AwsService,
    private readonly sitemapeService: SitemapService,
  ) {}

  async sitemapListParse(websiteUrl: UrlDto) {
    const validatedUrl = await validateUrl(websiteUrl.url);
    const correctSitemapUrl =
      await this.sitemapeService.getValidSitemapUrl(validatedUrl);

    if (correctSitemapUrl === null) return [];

    const sitemap = new Sitemapper({
      url: `${correctSitemapUrl[0]}`,
      timeout: 15000, // 15 seconds
    });

    try {
      const { sites } = await sitemap.fetch();

      if (sites.length) {
        await this.saveAndUploadSitemapToAWS(validatedUrl, sites);
      }
    } catch (error) {
      throw new BadRequestException('Something bad happened', {
        cause: new Error(),
        description: `Something bad happened while parsing sitemap`,
      });
    }
  }

  async saveAndUploadSitemapToAWS(
    url: string,
    urlList: string[],
  ): Promise<void> {
    const host: string = cleanHostname(url);

    try {
      const fileName = `${host}_sitemap_url.json`;

      await this.awsService.uploadJSON(
        urlList,
        'public/sitemap-urls',
        fileName,
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

      return await this.sitemapeService.getValidSitemapUrl(validUrl);
    } catch (error) {
      return error;
    }
  }

  async getSitemapExtractedList(websiteUrl: UrlDto): Promise<any> {
    const validUrl = await validateUrl(websiteUrl.url);
    const correctSitemapUrl =
      await this.sitemapeService.getValidSitemapUrl(validUrl);

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
}
