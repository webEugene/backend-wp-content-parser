import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  cleanHostname,
  validateUrl,
  formattingContent,
  createCriteria,
  findCurrentPage,
} from '../helpers';
import { saveParsedDataToCsv } from '../helpers/saveParsedDataToCsv';
import * as cheerio from 'cheerio';
import { ParsingDataDto } from './dto/parsing-data.dto';
import { getSitemapList } from '../helpers/getSitemapList';
import { UrlHostDto } from '../urls/dto/url-host.dto';
import { HEADER_REQUEST } from '../common/constants';

@Injectable()
export class ParserService {
  constructor(private readonly httpService: HttpService) {}

  async parseContent(data: ParsingDataDto) {
    const { url } = data;

    const validatedUrl = await validateUrl(url);
    const webHost: string = cleanHostname(validatedUrl);
    const getCriteriaList = createCriteria(data);
    const sitemapUrls = await getSitemapList(webHost);

    return await this.parseContentByUrls(webHost, sitemapUrls, getCriteriaList);
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async parseContentByUrls(host: string, urlsList: string[], siteCriteria) {
    const gatherData: any[] = [];

    for (const pageUrl of urlsList) {
      try {
        const { data } = await lastValueFrom(
          this.httpService.get(pageUrl, HEADER_REQUEST),
        );
        if (!data) {
          console.warn(`Skipping page ${pageUrl} (empty data or 404)`);
          continue;
        }

        const formattedData = formattingContent(data, siteCriteria, pageUrl);
        gatherData.push(formattedData);
      } catch (e) {
        console.error(`Failed to parse ${pageUrl}: ${e.message}`);
      }

      // Delay between requests to avoid overloading the server
      await this.delay(500 + Math.random() * 500);
    }

    await saveParsedDataToCsv(host, gatherData);
    return gatherData;
  }

  async grabAllLinksFromPage(url: string, domainOrigin: string) {
    try {
      const { data } = await lastValueFrom(
        this.httpService.get(url, HEADER_REQUEST),
      );
      const $ = cheerio.load(data);
      const links = [];

      // Select all anchor tags and extract href attributes
      $(`a:link:not([href^=javascript])`).each((index, element) => {
        const link = $(element).attr('href');
        const title = $(element).text().trim();
        const domainExtracted =
          link.startsWith('http://') || link.startsWith('https://')
            ? new URL(link)
            : link;

        if (link && link.trim() !== '') {
          links.push({
            link: link === '/' || link === '#' ? domainOrigin : link,
            title,
            origin:
              typeof domainExtracted === 'object'
                ? domainExtracted.origin
                : domainExtracted,
          });
        }
      });

      return links;
    } catch (e) {
      throw new BadRequestException(
        'Something bad happened while grabbing links',
        {
          cause: new Error(),
          description: `${e.message}`,
        },
      );
    }
  }

  async parseClasses(urlHostDto: UrlHostDto) {
    const validatedUrl = await validateUrl(urlHostDto.url);
    const webHost: string = cleanHostname(validatedUrl);
    const sitemapUrls = await getSitemapList(webHost);
    const getPages = await this.parseClassesFromUrls(sitemapUrls);

    return {
      site: urlHostDto.url,
      pages: getPages,
    };
  }

  async parseClassesFromUrls(urls: string[]) {
    const gatherData = new Set<string>();

    for (const pageUrl of urls) {
      try {
        const { data } = await lastValueFrom(
          this.httpService.get(pageUrl, HEADER_REQUEST),
        );
        if (!data) {
          console.warn(`Skipping page ${pageUrl} (empty data or 404)`);
          continue;
        }

        const $ = cheerio.load(data);
        const bodyClass = $('body').attr('class')?.trim();
        if (!bodyClass) {
          console.warn(`[WARNING] Page ${pageUrl} — Body class not found`);
          continue;
        }

        const currentPage = findCurrentPage(bodyClass);

        if (!currentPage) {
          console.warn(`[WARN] Page ${pageUrl} — Current page not found`);
          continue;
        }

        gatherData.add(currentPage);
      } catch (e) {
        console.error(`Failed to parse ${pageUrl}: ${e.message}`);
      }
      // Delay between requests to avoid overloading the server
      await this.delay(10);
    }

    return Array.from(gatherData);
  }
}
