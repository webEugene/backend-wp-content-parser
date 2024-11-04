import { Injectable } from '@nestjs/common';
import { UrlDto } from '../urls/dto/url-dto';

// const saveToStorageModule = require('./saveToStorage');
// const getSiteCriteria = require('./getSiteCriteria');
// const formattingData = require('./formattingData');
// const gatherData = [];

import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  cleanHostname,
  getSiteCriteria,
  validateUrl,
  formattingContent,
} from '../helpers';
import { CRITERIA_DIR, SITEMAP_URLS_DIR } from '../common/constants';
@Injectable()
export class ParserService {
  constructor(private readonly httpService: HttpService) {}
  async parseContent(websiteUrl: UrlDto) {
    const validUrl = await validateUrl(websiteUrl.url);
    const host: string = cleanHostname(validUrl);
    // const sitemapUrls = `${SITEMAP_URLS_DIR}/${host}_sitemap_url.json`;
    const sitemapUrls = await getSiteCriteria(
      `${SITEMAP_URLS_DIR}/${host}_sitemap_url.json`,
    );
    const siteCriteria = await getSiteCriteria(`${CRITERIA_DIR}/${host}.json`);

    const interval = setInterval(
      async (gen) => {
        const { value, done } = gen.next();
        if (done) {
          clearInterval(interval);
          // saveToStorageModule(dataUrls[0], gatherData);
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

            console.log(getFormattedData);
            // gatherData.push(getFormattedData);
            // console.log(
            //   `Parsing page ${value} is finished! Status: ${response.status}`,
            // );
          } catch (e) {
            console.error(e.message);
          }

          // axios
          //   .get(value)
          //   .then((response) => {
          //     if (!response.data)
          //       throw new Error(
          //         `Parsing page ${value} has been missed! Status: 404`,
          //       );
          //
          //     const getFormattedData = formattingData(
          //       response.data,
          //       siteCriteria,
          //       value,
          //     );
          //
          //     gatherData.push(getFormattedData);
          //     console.log(
          //       `Parsing page ${value} is finished! Status: ${response.status}`,
          //     );
          //   })
          //   .catch((err) => {
          //     console.error(err.message);
          //   });
        }
      },
      1000,
      sitemapUrls[Symbol.iterator](),
    );
  }
}
