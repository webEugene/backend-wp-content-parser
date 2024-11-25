import { Body, Controller, HttpStatus, Post, Req } from '@nestjs/common';
import { WpDetectService } from '../wp-detect/wp-detect.service';
import { UrlDto } from './dto/url-dto';
import { UrlsService } from './urls.service';
import { SitemapDataDto } from './dto/sitemap-data.dto';
import { StaticAnalyticsService } from '../static-analytics/static-analytics.service';
import { Ip } from '../helpers'

@Controller('urls')
export class UrlsController {
  constructor(
    private readonly wpDetectService: WpDetectService,
    private readonly urlsService: UrlsService,
    private readonly staticAnalyticsService: StaticAnalyticsService,
  ) {}

  @Post()
  // @Ip() ip: string
  async checkUrl(@Body() url: UrlDto): Promise<any> {
    const result = await this.wpDetectService.checkWebsiteIsWP(url);

    if (result?.code && result?.code === 'ENOTFOUND') {
      return {
        data: false,
        statusCode: HttpStatus.NOT_FOUND,
        error: `Website ${url.url} not found or url is incorrect`,
      };
    }
    const findHostname = await this.staticAnalyticsService.findHostname(
      url.url,
    );

    if (!findHostname) {
      await this.staticAnalyticsService.createAnalytic({
        hostname: url.url,
        tries: 1,
      });
    } else {
      await this.staticAnalyticsService.updateAnalytic({
        hostname: url.url,
        tries: findHostname.tries,
      });
    }

    return {
      data: result,
      statusCode: HttpStatus.OK,
      error: null,
    };
  }

  @Post('/sitemap-parse')
  async parseSitemap(@Body() sitemapDataDto: SitemapDataDto) {
    const { url, classNames } = sitemapDataDto;
    return await this.urlsService.sitemapListParse({ url }, classNames);
  }
}
