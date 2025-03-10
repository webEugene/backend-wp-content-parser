import { BadRequestException, Injectable } from '@nestjs/common';
import { UrlDto } from '../urls/dto/url-dto';

import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  cleanHostname,
  getSiteCriteria,
  validateUrl,
  formattingContent,
} from '../helpers';
import { CRITERIA_DIR, SITEMAP_URLS_DIR } from '../common/constants';
import { saveParsedDataToCsv } from '../helpers/saveParsedDataToCsv';
import * as cheerio from 'cheerio';

@Injectable()
export class ParserService {
  constructor(private readonly httpService: HttpService) {}

  async parseContent(websiteUrl: UrlDto) {
    const validUrl = await validateUrl(websiteUrl.url);
    const host: string = cleanHostname(validUrl);
    const sitemapUrls = await getSiteCriteria(
      `${SITEMAP_URLS_DIR}/${host}_sitemap_url.json`,
    );
    const siteCriteria = await getSiteCriteria(`${CRITERIA_DIR}/${host}.json`);
    const gatherData = [];

    const interval = setInterval(
      async (gen) => {
        const { value, done } = gen.next();

        if (done) {
          clearInterval(interval);
          await saveParsedDataToCsv(host, gatherData);
        } else {
          try {
            const { data } = await lastValueFrom(this.httpService.get(value));
            if (!data)
              throw new Error(
                `Parsing page ${value} has been missed! Status: 404`,
              );
            const getFormattedData = formattingContent(
              data,
              siteCriteria,
              value,
            );
            gatherData.push(getFormattedData);
          } catch (e) {
            throw new BadRequestException('Something bad happened', {
              cause: new Error(),
              description: `${e.message}`,
            });
          }
        }
      },
      1000,
      sitemapUrls[Symbol.iterator](),
    );
  }

  async grabAllLinksFromPage(url: string, domainOrigin: string) {
    try {
      const { data } = await lastValueFrom(this.httpService.get(url));
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
}
