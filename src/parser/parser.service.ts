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
}
