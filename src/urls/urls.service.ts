import { Injectable } from '@nestjs/common';
import { UrlDto } from './dto/url-dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import Sitemapper from 'sitemapper';
@Injectable()
export class UrlsService {
  constructor(private readonly httpService: HttpService) {}
  sitemapVariantsList: string[] = [
    'sitemap-index.xml',
    'sitemap.xml',
    'sitemap.php',
    // 'sitemap.txt',
    // 'sitemap_index.xml',
    // 'sitemap.xml.gz',
    // 'sitemap/',
    // 'sitemap/sitemap.xml',
    // 'sitemapindex.xml',
    // 'sitemap/index.xml',
    // 'sitemap1.xml',
  ];

  async sitemapListParse(websiteUrl: UrlDto) {
    const validUrl = await this.validateUrl(websiteUrl.url);
    // let sitemap;
    const interval = setInterval(
      (gen) => {
        const { value, done } = gen.next();

        if (done) {
          clearInterval(interval);
        } else {
          console.log(value, done);
          this.getSitemapUrl(`${validUrl}${value}`);
          // if (!sitemapList?.length && sitemapList?.length === 0) {
          // console.log(this.getSitemapUrl(`${validUrl}${value}`))
          // sitemap = this.getSitemapUrl(`${validUrl}${value}`);
          // }
        }
      },
      2000,
      this.sitemapVariantsList[Symbol.iterator](),
    );

    // for (let i = 0; i < this.sitemapVariantsList.length; i++) {
    //   console.log(this.sitemapVariantsList[i])
    //   if (sitemapList?.length && sitemapList?.length > 0) break;
    //   sitemapList = new Sitemapper({
    //     url: `${validUrl}${this.sitemapVariantsList[i]}`,
    //     timeout: 15000, // 15 seconds
    //   });
    // }
    // console.log(sitemap.status);

    // try {
    //   const { sites } = await sitemapList.fetch();
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

  async getSitemapUrl(url) {
    const { data, status } = await lastValueFrom(this.httpService.get(url));
    // console.log(status)
    return status;
  }
}
