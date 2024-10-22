import { HttpStatus, Injectable } from '@nestjs/common';
import { UrlDto } from './dto/url-dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
// import Sitemapper from 'sitemapper';
import * as fs from 'fs';
import { SITEMAP_URLS_DIR } from '../common/constants';
import { cleanHostname } from '../helpers/cleanHostname';

@Injectable()
export class UrlsService {
  constructor(private readonly httpService: HttpService) {}
  sitemapVariantsList: string[] = [
    'sitemap-index.xml',
    'sitemap.xml',
    'sitemap.php',
    'sitemap.txt',
    'sitemap_index.xml',
    'sitemap.xml.gz',
    'sitemap/',
    'sitemap/sitemap.xml',
    'sitemapindex.xml',
    'sitemap/index.xml',
    'sitemap1.xml',
  ];

  async sitemapListParse(websiteUrl: UrlDto) {
    const validUrl = await this.validateUrl(websiteUrl.url);
    this.storeUrls(validUrl, 'test');
    // const correctSitemapUrl = await this.getValidSitemapUrl(validUrl);
    //
    // if (correctSitemapUrl === null) return [];
    // const sitemap = new Sitemapper({
    //   url: `${correctSitemapUrl}`,
    //   timeout: 15000, // 15 seconds
    // });
    //
    // try {
    //   const { sites } = await sitemap.fetch();
    //   console.log(sites);
    // } catch (error) {
    //   console.log(error);
    // }
  }

  validateUrl(url) {
    const urlPattern =
      /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;

    if (!urlPattern.test(url)) {
      return `https://${url}`;
    } else {
      return url;
    }
  }

  async getValidSitemapUrl(siteUrl: string) {
    let sitemapUrl = null;
    for await (const sitemap of this.sitemapVariantsList) {
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
    let returnFilename: string[] | string = '';
    fs.readdir(SITEMAP_URLS_DIR, (err, files) => {
      if (err) return new Error('Something is wrong!');
      returnFilename = files.filter((item) =>
        item === `${host}_sitemap_url.json` ? `${host}_sitemap_url.json` : '',
      );
    console.log(returnFilename, urlList)
    });
    // try {
    //   await fs.writeFile(
    //     `${SITEMAP_URLS_DIR}/${host}_sitemap_url.json`,
    //     urlList,
    //     { encoding: 'utf8', mode: '0644', flag: 'a' },
    //     (err) => {
    //       if (err) throw new Error(`Error writing data: ${err}`);
    //     },
    //   );
    // } catch (e) {
    //   console.log(e.code);
    // }
  }
}
