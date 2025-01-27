import {
  Body,
  Controller,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { WpDetectService } from '../wp-detect/wp-detect.service';
import { UrlsService } from './urls.service';
import { SitemapDataDto } from './dto/sitemap-data.dto';
import { AnalyticsService } from '../static-analytics/analytics.service';
//import { Ip } from '../helpers';
import { UrlHostDto } from './dto/url-host.dto';
import { validateUrl } from '../helpers';
import { SitemapTestDto } from './dto/sitemap-test.dto';

@Controller('urls')
export class UrlsController {
  constructor(
    private readonly wpDetectService: WpDetectService,
    private readonly urlsService: UrlsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post('/wp-check')
  // @Ip() ip: string
  async detectWP(@Body() urlHostDto: UrlHostDto): Promise<any> {
    const validUrl = await validateUrl(urlHostDto.url);
    const result = await this.wpDetectService.checkWebsiteIsWP(validUrl);

    if (result?.code && result?.code === 'ENOTFOUND') {
      return {
        data: {
          isWp: false,
          url: result.hostname,
        },
        statusCode: HttpStatus.NOT_FOUND,
        error: `Website ${result.hostname} not found / url is incorrect`,
      };
    }

    const findHost = await this.analyticsService.findHostname({
      url: validUrl,
      host: urlHostDto.host,
    });

    if (!findHost) {
      await this.analyticsService.createWpCheckAnalytic({
        website: validUrl,
        tries: 1,
        host: urlHostDto.host,
        wpDetect: result.isWp,
      });
    } else {
      await this.analyticsService.updateAnalytic({
        website: findHost.website,
        host: findHost.host,
        tries: findHost.tries,
        wpDetect: result.isWp,
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

  @Post('/sitemap-check')
  async detectSitemap(@Body() sitemapTestDto: SitemapTestDto) {
    try {
      const validUrl = await validateUrl(sitemapTestDto.url);
      const result =
        await this.urlsService.checkWebsiteHasSitemapUrl(sitemapTestDto);
      const findHost = await this.analyticsService.findHostnameSitemap({
        url: validUrl,
        host: sitemapTestDto.host,
      });

      if (!findHost) {
        await this.analyticsService.createSitemapTestAnalytic({
          website: validUrl,
          tries: 1,
          host: sitemapTestDto.host,
          status: result !== null,
        });
      } else {
        await this.analyticsService.updateSitemapTestAnalytic({
          website: findHost.website,
          host: findHost.host,
          tries: findHost.tries,
          status: result !== null,
        });
      }

      if (result === null)
        throw new Error('Website is not WP or does not have sitemap');

      return {
        data: result,
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      throw new NotFoundException({
        message: error.message,
      });
    }
  }

  @Post('/sitemap-extract')
  async extractSitemapList(@Body() urlHostDto: UrlHostDto) {
    try {
      const sitemapList =
        await this.urlsService.getSitemapExtractedList(urlHostDto);
      if (sitemapList.length === 0)
        throw new Error('Website does not have sitemap or url is incorrect');

      return {
        data: sitemapList,
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      throw new NotFoundException({
        message: error.message,
      });
    }
  }
}
