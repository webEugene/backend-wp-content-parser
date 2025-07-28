import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  cleanHostname,
  validateUrl,
  formattingContent,
  createCriteria,
  getSiteCriteria,
} from '../helpers';
import { saveParsedDataToCsv } from '../helpers/saveParsedDataToCsv';
import * as cheerio from 'cheerio';
import { ParsingDataDto } from './dto/parsing-data.dto';
import { ClassNamesType } from '../common/types/ClassNamesType';
import { SITEMAP_URLS_DIR } from '../common/constants';
import { getSitemapList } from '../helpers/getSitemapList';

@Injectable()
export class ParserService {
  constructor(private readonly httpService: HttpService) {}

  async parseContent(data: ParsingDataDto) {
    const { url } = data;

    const validatedUrl = await validateUrl(url);
    const webHost: string = cleanHostname(validatedUrl);
    const getCriteriaList = createCriteria(data);
    const sitemapUrls = await getSitemapList(webHost);
    // const createCriteriaJson = createCriteria(data);
    // const siteCriteria = await getSiteCriteria(
    //   `${CRITERIA_DIR}/${webHost}.json`,
    // );
    // console.log(getCriteriaList);

    return await this.parseContentByUrls(webHost, sitemapUrls, getCriteriaList);
  }

  async parseContentByUrls(host: string, urlsList: string[], siteCriteria) {
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
            // console.log(getFormattedData);
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
      urlsList[Symbol.iterator](),
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
