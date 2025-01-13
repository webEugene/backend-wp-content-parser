import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { WpDetectService } from '../wp-detect/wp-detect.service';
import { UrlsService } from './urls.service';
import { SitemapDataDto } from './dto/sitemap-data.dto';
import { StaticAnalyticsService } from '../static-analytics/static-analytics.service';
import { Ip } from '../helpers';
import { UrlHostDto } from './dto/url-host.dto';

@Controller('urls')
export class UrlsController {
  constructor(
    private readonly wpDetectService: WpDetectService,
    private readonly urlsService: UrlsService,
    private readonly staticAnalyticsService: StaticAnalyticsService,
  ) {}

  @Post()
  // @Ip() ip: string
  async checkUrl(@Body() urlHostDto: UrlHostDto): Promise<any> {
    const result = await this.wpDetectService.checkWebsiteIsWP(urlHostDto);

    if (result?.code && result?.code === 'ENOTFOUND') {
      return {
        data: false,
        statusCode: HttpStatus.NOT_FOUND,
        error: `Website ${urlHostDto.url} not found or url is incorrect`,
      };
    }
    const findHost = await this.staticAnalyticsService.findHostname(urlHostDto);

    if (!findHost) {
      await this.staticAnalyticsService.createAnalytic({
        website: urlHostDto.url,
        tries: 1,
        host: urlHostDto.host,
        wpDetect: result,
      });
    } else {
      await this.staticAnalyticsService.updateAnalytic({
        website: findHost.website,
        host: findHost.host,
        tries: findHost.tries,
        wpDetect: result,
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
